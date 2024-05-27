import { DEFAULT_HASHER } from './poseidon';
import { getJsonLdDocLoader } from '../loaders/jsonld-loader';
export function getHasher(opts) {
    return opts?.hasher ?? DEFAULT_HASHER;
}
export function getDocumentLoader(opts) {
    const ipfsNodeURL = opts?.ipfsNodeURL ?? null;
    const ipfsGatewayURL = opts?.ipfsGatewayURL ?? null;
    return opts?.documentLoader ?? getJsonLdDocLoader(ipfsNodeURL, ipfsGatewayURL);
}
