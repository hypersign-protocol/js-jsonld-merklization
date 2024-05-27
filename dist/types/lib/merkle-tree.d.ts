import { InMemoryDB, Merkletree } from '@iden3/js-merkletree';
import { RDFEntry } from './rdf-entry';
export declare const getMerkleTreeInitParam: (prefix?: string, writable?: boolean, maxLevels?: number) => {
    db: InMemoryDB;
    writable: boolean;
    maxLevels: number;
};
export declare const addEntriesToMerkleTree: (mt: Merkletree, entries: RDFEntry[]) => Promise<void>;
