import { MerklizationConstants } from './constants';
import { poseidon } from '@iden3/js-crypto';
export class PoseidonHasher {
    constructor(_hasher = poseidon) {
        this._hasher = _hasher;
    }
    async hash(inp) {
        return this._hasher.hash(inp);
    }
    async hashBytes(b) {
        return this._hasher.hashBytes(b);
    }
    prime() {
        return MerklizationConstants.Q;
    }
}
export const DEFAULT_HASHER = new PoseidonHasher();
