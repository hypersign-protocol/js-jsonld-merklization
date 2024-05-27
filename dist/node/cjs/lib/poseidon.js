"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_HASHER = exports.PoseidonHasher = void 0;
const constants_1 = require("./constants");
const js_crypto_1 = require("@iden3/js-crypto");
class PoseidonHasher {
    constructor(_hasher = js_crypto_1.poseidon) {
        this._hasher = _hasher;
    }
    async hash(inp) {
        return this._hasher.hash(inp);
    }
    async hashBytes(b) {
        return this._hasher.hashBytes(b);
    }
    prime() {
        return constants_1.MerklizationConstants.Q;
    }
}
exports.PoseidonHasher = PoseidonHasher;
exports.DEFAULT_HASHER = new PoseidonHasher();
