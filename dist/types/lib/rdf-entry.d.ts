import { Path } from './path';
import { Hasher, Value } from './types/types';
import { RDFDataset } from './rdf-dataset';
export declare class RDFEntry {
    key: Path;
    value: Value;
    dataType: string;
    hasher: Hasher;
    constructor(key: Path, value: Value, dataType?: string, hasher?: Hasher);
    getHasher(): Hasher;
    getKeyMtEntry(): Promise<bigint>;
    getValueMtEntry(): Promise<bigint>;
    getKeyValueMTEntry(): Promise<{
        k: bigint;
        v: bigint;
    }>;
    static newRDFEntry: (k: Path, v: Value) => RDFEntry;
    static fromDataSet(ds: RDFDataset, hasher?: Hasher): Promise<RDFEntry[]>;
}
