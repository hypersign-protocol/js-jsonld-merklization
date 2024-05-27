import { MerklizationConstants } from './constants';
import { Parser } from 'n3';
import { canonize } from 'jsonld';
import { DatasetIdx } from './dataset-idx';
import { getGraphName } from './utils';
import { RefTp } from './ref-tp';
import { NodeType } from './types/types';
import { getDocumentLoader } from './options';
export class RDFDataset {
    constructor(graphs = new Map()) {
        this.graphs = graphs;
    }
    static async fromDocument(doc, documentLoader = getDocumentLoader()) {
        const normalizedData = await canonize(doc, {
            format: MerklizationConstants.QUADS_FORMAT,
            documentLoader
        });
        const parser = new Parser({ format: MerklizationConstants.QUADS_FORMAT });
        const quads = parser.parse(normalizedData);
        const ds = new RDFDataset();
        for (const q of quads) {
            const graphName = q.graph.termType === MerklizationConstants.DEFAULT_GRAPH_TERM_TYPE
                ? MerklizationConstants.DEFAULT_GRAPH_NODE_NAME
                : q.graph.value;
            const graphQuads = ds.graphs.get(graphName) ?? [];
            graphQuads.push(q);
            ds.graphs.set(graphName, graphQuads);
        }
        return ds;
    }
    static getQuad(ds, idx) {
        const quads = ds.graphs.get(idx.graphName);
        if (!quads) {
            throw MerklizationConstants.ERRORS.GRAPH_NOT_FOUND;
        }
        if (idx.idx >= quads.length) {
            throw MerklizationConstants.ERRORS.QUAD_NOT_FOUND;
        }
        return quads[idx.idx];
    }
    static iterGraphsOrdered(ds, callback) {
        const graphNames = [];
        for (const graphName of ds.graphs.keys()) {
            graphNames.push(graphName);
        }
        graphNames.sort((a, b) => a.localeCompare(b));
        for (const graphName of graphNames) {
            const quads = ds.graphs.get(graphName);
            callback(graphName, quads);
        }
    }
    static findParent(ds, q) {
        const parent = RDFDataset.findParentInsideGraph(ds, q);
        if (parent) {
            return parent;
        }
        return RDFDataset.findGraphParent(ds, q);
    }
    static findParentInsideGraph(ds, q) {
        const graphName = getGraphName(q);
        let result;
        const quads = ds.graphs.get(graphName);
        if (!quads) {
            return undefined;
        }
        const qKey = RefTp.getRefFromQuad(q.subject);
        if (qKey.tp === NodeType.Undefined) {
            return undefined;
        }
        let found = false;
        // var result datasetIdx
        for (let idx = 0; idx < quads.length; idx++) {
            const quad = quads[idx];
            if (quad.equals(q)) {
                continue;
            }
            const objKey = RefTp.getRefFromQuad(quad.object);
            if (objKey.tp === NodeType.Undefined) {
                continue;
            }
            if (qKey?.tp === objKey?.tp && qKey?.val === objKey?.val) {
                if (found) {
                    throw MerklizationConstants.ERRORS.MULTIPLE_PARENTS_FOUND;
                }
                found = true;
                result = new DatasetIdx(graphName, idx);
            }
        }
        return result;
    }
    static findGraphParent(ds, q) {
        if (!q.graph) {
            return undefined;
        }
        const qKey = RefTp.getRefFromQuad(q.graph);
        if (qKey.tp === NodeType.Undefined) {
            return undefined;
        }
        if (qKey.tp !== NodeType.BlankNode) {
            throw new Error('graph parent can only be a blank node');
        }
        let found = false;
        let result;
        for (const [graphName, quads] of ds.graphs) {
            for (let idx = 0; idx < quads.length; idx++) {
                const quad = quads[idx];
                if (quad.equals(q)) {
                    continue;
                }
                const objKey = RefTp.getRefFromQuad(quad.object);
                if (objKey.tp === NodeType.Undefined) {
                    continue;
                }
                if (qKey.toString() == objKey.toString()) {
                    if (found) {
                        throw MerklizationConstants.ERRORS.MULTIPLE_PARENTS_FOUND;
                    }
                    found = true;
                    result = new DatasetIdx(graphName, idx);
                }
            }
        }
        if (found) {
            return result;
        }
        else {
            throw MerklizationConstants.ERRORS.PARENT_NOT_FOUND;
        }
    }
}
// assert consistency of dataset and validate that only
// quads we support contains in dataset.
RDFDataset.assertDatasetConsistency = (ds) => {
    for (const [graph, quads] of ds.graphs) {
        for (const q of quads) {
            if (!graph) {
                throw new Error('empty graph name');
            }
            if (graph === MerklizationConstants.DEFAULT_GRAPH_NODE_NAME && q.graph.id) {
                throw new Error('graph should be nil for @default graph');
            }
            if (!q.graph.id && graph !== MerklizationConstants.DEFAULT_GRAPH_NODE_NAME) {
                throw new Error('graph should not be nil for non-@default graph');
            }
        }
    }
};
