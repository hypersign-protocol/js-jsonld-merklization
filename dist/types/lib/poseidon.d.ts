import { Hasher } from './types/types';
export declare class PoseidonHasher implements Hasher {
    private readonly _hasher;
    constructor(_hasher?: typeof import("@iden3/js-crypto").Poseidon);
    hash(inp: bigint[]): Promise<bigint>;
    hashBytes(b: Uint8Array): Promise<bigint>;
    prime(): bigint;
}
export declare const DEFAULT_HASHER: PoseidonHasher;
