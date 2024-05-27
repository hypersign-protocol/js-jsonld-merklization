"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentLoader = exports.getHasher = void 0;
const poseidon_1 = require("./poseidon");
const jsonld_loader_1 = require("../loaders/jsonld-loader");
function getHasher(opts) {
    return opts?.hasher ?? poseidon_1.DEFAULT_HASHER;
}
exports.getHasher = getHasher;
function getDocumentLoader(opts) {
    const ipfsNodeURL = opts?.ipfsNodeURL ?? null;
    const ipfsGatewayURL = opts?.ipfsGatewayURL ?? null;
    return opts?.documentLoader ?? (0, jsonld_loader_1.getJsonLdDocLoader)(ipfsNodeURL, ipfsGatewayURL);
}
exports.getDocumentLoader = getDocumentLoader;
