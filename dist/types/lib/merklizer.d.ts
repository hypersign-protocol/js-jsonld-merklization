import { Hasher, Value, Options } from './types/types';
import { NodeObject } from 'jsonld';
import { Merkletree, Hash, Proof } from '@iden3/js-merkletree';
import { RDFEntry } from './rdf-entry';
import { Path } from './path';
import { MtValue } from './mt-value';
export declare class Merklizer {
    readonly srcDoc: string | null;
    readonly mt: Merkletree | null;
    readonly hasher: Hasher;
    readonly entries: Map<string, RDFEntry>;
    compacted: NodeObject | null;
    documentLoader: import("..").DocumentLoader;
    constructor(srcDoc?: string | null, mt?: Merkletree | null, hasher?: Hasher, entries?: Map<string, RDFEntry>, compacted?: NodeObject | null, documentLoader?: import("..").DocumentLoader);
    proof(p: Path): Promise<{
        proof: Proof;
        value?: MtValue;
    }>;
    mkValue(val: Value): MtValue;
    resolveDocPath(path: string, opts?: Options): Promise<Path>;
    entry(path: Path): Promise<RDFEntry>;
    jsonLDType(path: Path): Promise<string>;
    root(): Promise<Hash>;
    rawValue(path: Path): Value;
    private rvExtractArrayIdx;
    static merklizeJSONLD(docStr: string, opts?: Options): Promise<Merklizer>;
    static hashValue(dataType: string, value: unknown): Promise<bigint>;
    private static hashValueWithHasher;
    get options(): Options;
}
