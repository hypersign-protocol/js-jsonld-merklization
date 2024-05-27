import { Hasher } from './types/types';
import { Quad } from 'n3';
import { Path } from './path';
import { RDFDataset } from './rdf-dataset';
import { DatasetIdx } from './dataset-idx';
export declare class Relationship {
    parents: Map<string, DatasetIdx>;
    children: Map<string, Map<string, number>>;
    hasher: Hasher;
    constructor(parents?: Map<string, DatasetIdx>, children?: Map<string, Map<string, number>>, hasher?: Hasher);
    static getIriValue(n: Quad): Quad;
    path(dsIdx: DatasetIdx, ds: RDFDataset, idx: number): Path;
    static newRelationship(ds: RDFDataset, hasher: Hasher): Promise<Relationship>;
}
