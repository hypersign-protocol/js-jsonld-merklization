"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJsonLdDocLoader = exports.normalizeIPFSNodeURL = exports.JsonLDLoader = void 0;
const util_1 = require("jsonld/lib/util");
const constants_1 = require("jsonld/lib/constants");
const JsonLdError_1 = __importDefault(require("jsonld/lib/JsonLdError"));
const url_1 = require("jsonld/lib/url");
/**
 * Creates a built-in node document loader.
 *
 * @param options the options to use:
 *          [secure]: require all URLs to use HTTPS. (default: false)
 *          [strictSSL]: true to require SSL certificates to be valid,
 *            false not to. (default: true)
 *          [maxRedirects]: the maximum number of redirects to permit.
 *            (default: none)
 *          [headers]: an object (map) of headers which will be passed as
 *            request headers for the requested document. Accept is not
 *            allowed. (default: none).
 *          [httpAgent]: a Node.js `http.Agent` to use with 'http' requests.
 *            (default: none)
 *          [httpsAgent]: a Node.js `https.Agent` to use with 'https' requests.
 *            (default: An agent with rejectUnauthorized to the strictSSL
 *            value.ts)
 *
 * @return the node document loader.
 */
class JsonLDLoader {
    async loadDocument(url, redirects = []) {
        const isHttp = url.startsWith('http:');
        const isHttps = url.startsWith('https:');
        if (!isHttp && !isHttps) {
            throw new JsonLdError_1.default('URL could not be dereferenced; only "http" and "https" URLs are ' + 'supported.', 'jsonld.InvalidUrl', { code: 'loading document failed', url });
        }
        // TODO: disable cache until HTTP caching implemented
        // let doc = null; //cache.get(url);
        // if (doc !== null) {
        //   return doc;
        // }
        let alternate = null;
        const { res, body } = await _fetch({ url });
        const doc = { contextUrl: null, documentUrl: url, document: body || null };
        // handle error
        if (res.status >= 400) {
            throw new JsonLdError_1.default(`URL "${url}" could not be dereferenced: ${res.statusText}`, 'jsonld.InvalidUrl', {
                code: 'loading document failed',
                url,
                httpStatusCode: res.status
            });
        }
        const link = res.headers.get('link');
        let location = res.headers.get('location');
        const contentType = res.headers.get('content-type');
        // handle Link Header
        if (link && contentType !== 'application/ld+json' && contentType !== 'application/json') {
            // only 1 related link header permitted
            const linkHeaders = (0, util_1.parseLinkHeader)(link);
            const linkedContext = linkHeaders[constants_1.LINK_HEADER_CONTEXT];
            if (Array.isArray(linkedContext)) {
                throw new JsonLdError_1.default('URL could not be dereferenced, it has more than one associated ' + 'HTTP Link Header.', 'jsonld.InvalidUrl', { code: 'multiple context link headers', url });
            }
            if (linkedContext) {
                doc.contextUrl = linkedContext.target;
            }
            // "alternate" link header is a redirect
            alternate = linkHeaders.alternate;
            if (alternate &&
                alternate['type'] == 'application/ld+json' &&
                !(contentType || '').match(/^application\/(\w*\+)?json$/)) {
                location = (0, url_1.prependBase)(url, alternate['target']);
            }
        }
        // handle redirect
        if ((alternate || (res.status >= 300 && res.status < 400)) && location) {
            if (redirects.length === -1) {
                throw new JsonLdError_1.default('URL could not be dereferenced; there were too many redirects.', 'jsonld.TooManyRedirects', {
                    code: 'loading document failed',
                    url,
                    httpStatusCode: res.status,
                    redirects
                });
            }
            if (redirects.indexOf(url) !== -1) {
                throw new JsonLdError_1.default('URL could not be dereferenced; infinite redirection was detected.', 'jsonld.InfiniteRedirectDetected', {
                    code: 'recursive context inclusion',
                    url,
                    httpStatusCode: res.status,
                    redirects
                });
            }
            redirects.push(url);
            // location can be relative, turn into full url
            const nextUrl = new URL(location, url).href;
            return this.loadDocument(nextUrl, redirects);
        }
        // cache for each redirected URL
        redirects.push(url);
        // TODO: disable cache until HTTP caching implemented
        /*
        for(let i = 0; i < redirects.length; ++i) {
          cache.set(
            redirects[i],
            {contextUrl: null, documentUrl: redirects[i], document: body});
        }
        */
        return doc;
    }
}
exports.JsonLDLoader = JsonLDLoader;
const ipfsMethodCat = 'cat';
function normalizeIPFSNodeURL(ipfsNodeURL, apiMethod) {
    const apiSuffix = '/api/v0';
    while (ipfsNodeURL.endsWith('/')) {
        ipfsNodeURL = ipfsNodeURL.slice(0, -1);
    }
    if (!ipfsNodeURL.endsWith(apiSuffix)) {
        ipfsNodeURL += apiSuffix;
    }
    return ipfsNodeURL + '/' + apiMethod;
}
exports.normalizeIPFSNodeURL = normalizeIPFSNodeURL;
function trimRightSlash(url) {
    while (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    return url;
}
function trimLeftSlash(url) {
    while (url.startsWith('/')) {
        url = url.slice(1);
    }
    return url;
}
function buildIpfsGatewayURL(ipfsGatewayURL, documentURL) {
    return trimRightSlash(ipfsGatewayURL) + '/ipfs/' + trimLeftSlash(documentURL);
}
async function loadIPFS(url, ipfsNodeURL, ipfsGatewayURL) {
    const documentURL = ipfsURLPrefix + url;
    if (!ipfsNodeURL && !ipfsGatewayURL) {
        throw new JsonLdError_1.default('IPFS is not configured', 'jsonld.IPFSNotConfigured', {
            code: 'loading document failed',
            url: documentURL
        });
    }
    if (ipfsNodeURL !== null) {
        return await loadFromIPFSNode(url, ipfsNodeURL);
    }
    else {
        return await loadFromIPFSGateway(url, ipfsGatewayURL);
    }
}
async function loadFromIPFSNode(url, ipfsNodeURL) {
    const catRequestURL = new URL(normalizeIPFSNodeURL(ipfsNodeURL, ipfsMethodCat));
    catRequestURL.searchParams.append('arg', url);
    const { res, body } = await _fetch({ url: catRequestURL, method: 'POST' });
    if (res.status != 200) {
        throw new Error(`Error calling IPFS node: [${res.status}] ${res.statusText}\n${body}`);
    }
    return {
        contextUrl: null,
        document: body || null,
        documentUrl: ipfsURLPrefix + url
    };
}
async function loadFromIPFSGateway(url, ipfsGatewayURL) {
    const loader = new JsonLDLoader();
    const document = await loader.loadDocument(buildIpfsGatewayURL(ipfsGatewayURL, url), []);
    document.contextUrl = null;
    document.documentUrl = ipfsURLPrefix + url;
    return document;
}
async function _fetch({ url, method }) {
    const options = {};
    if (typeof method !== 'undefined') {
        options['method'] = method;
    }
    try {
        url = new URL(url);
        if (url.username && url.password) {
            options['headers'] = {
                ...(options['headers'] ?? {}),
                authorization: `Basic ${btoa(url.username + ':' + url.password)}`
            };
            url = removeCredentialsFromURL(url);
        }
        const res = await fetch(url, options);
        if (res.status >= 300 && res.status < 400) {
            return { res, body: null };
        }
        const text = await res.text();
        if (text && text.length > 0 && text.startsWith('{')) {
            return { res, body: JSON.parse(text) };
        }
        return { res, body: text };
    }
    catch (e) {
        // HTTP errors have a response in them
        // ky considers redirects HTTP errors
        if (e.response) {
            return { res: e.response, body: null };
        }
        throw new JsonLdError_1.default('URL could not be dereferenced, an error occurred.', 'jsonld.LoadDocumentError', { code: 'loading document failed', url, cause: e });
    }
}
function removeCredentialsFromURL(url) {
    const urlObj = new URL(url);
    urlObj.username = '';
    urlObj.password = '';
    return urlObj.href;
}
const ipfsURLPrefix = 'ipfs://';
const getJsonLdDocLoader = (ipfsNodeURL = null, ipfsGatewayURL = null) => {
    return async (url) => {
        if (url.startsWith(ipfsURLPrefix)) {
            const ipfsURL = url.slice(ipfsURLPrefix.length);
            return await loadIPFS(ipfsURL, ipfsNodeURL, ipfsGatewayURL);
        }
        const loader = new JsonLDLoader();
        return loader.loadDocument(url, []);
    };
};
exports.getJsonLdDocLoader = getJsonLdDocLoader;
