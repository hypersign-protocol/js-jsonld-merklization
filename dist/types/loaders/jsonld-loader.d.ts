import { RemoteDocument, Url } from 'jsonld/jsonld-spec';
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
export declare class JsonLDLoader {
    loadDocument(url: string, redirects?: string[]): any;
}
export declare function normalizeIPFSNodeURL(ipfsNodeURL: string, apiMethod: string): string;
export type DocumentLoader = (url: Url) => Promise<RemoteDocument>;
export declare const getJsonLdDocLoader: (ipfsNodeURL?: string, ipfsGatewayURL?: string) => DocumentLoader;
