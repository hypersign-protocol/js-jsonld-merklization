import { Quad } from 'n3';
import { JsonLdDocument } from 'jsonld';
import { DocumentLoader } from '../loaders/jsonld-loader';
import { DatasetIdx } from './dataset-idx';
export declare class RDFDataset {
    readonly graphs: Map<string, Quad[]>;
    constructor(graphs?: Map<string, Quad[]>);
    static assertDatasetConsistency: (ds: RDFDataset) => void;
    static fromDocument(doc: JsonLdDocument, documentLoader?: DocumentLoader): Promise<RDFDataset>;
    static getQuad(ds: RDFDataset, idx: DatasetIdx): Quad;
    static iterGraphsOrdered(ds: RDFDataset, callback: (graphName: string, quads: Quad[]) => void): void;
    static findParent(ds: RDFDataset, q: Quad): DatasetIdx | undefined;
    static findParentInsideGraph(ds: RDFDataset, q: Quad): DatasetIdx | undefined;
    static findGraphParent(ds: RDFDataset, q: Quad): DatasetIdx | undefined;
}
