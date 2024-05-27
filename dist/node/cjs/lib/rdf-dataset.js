"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDFDataset = void 0;
const constants_1 = require("./constants");
const n3_1 = require("n3");
const jsonld_1 = require("jsonld");
const dataset_idx_1 = require("./dataset-idx");
const utils_1 = require("./utils");
const ref_tp_1 = require("./ref-tp");
const types_1 = require("./types/types");
const options_1 = require("./options");
class RDFDataset {
    constructor(graphs = new Map()) {
        this.graphs = graphs;
    }
    static async fromDocument(doc, documentLoader = (0, options_1.getDocumentLoader)()) {
        const normalizedData = await (0, jsonld_1.canonize)(doc, {
            format: constants_1.MerklizationConstants.QUADS_FORMAT,
            documentLoader
        });
        const parser = new n3_1.Parser({ format: constants_1.MerklizationConstants.QUADS_FORMAT });
        const quads = parser.parse(normalizedData);
        const ds = new RDFDataset();
        for (const q of quads) {
            const graphName = q.graph.termType === constants_1.MerklizationConstants.DEFAULT_GRAPH_TERM_TYPE
                ? constants_1.MerklizationConstants.DEFAULT_GRAPH_NODE_NAME
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
            throw constants_1.MerklizationConstants.ERRORS.GRAPH_NOT_FOUND;
        }
        if (idx.idx >= quads.length) {
            throw constants_1.MerklizationConstants.ERRORS.QUAD_NOT_FOUND;
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
        const graphName = (0, utils_1.getGraphName)(q);
        let result;
        const quads = ds.graphs.get(graphName);
        if (!quads) {
            return undefined;
        }
        const qKey = ref_tp_1.RefTp.getRefFromQuad(q.subject);
        if (qKey.tp === types_1.NodeType.Undefined) {
            return undefined;
        }
        let found = false;
        // var result datasetIdx
        for (let idx = 0; idx < quads.length; idx++) {
            const quad = quads[idx];
            if (quad.equals(q)) {
                continue;
            }
            const objKey = ref_tp_1.RefTp.getRefFromQuad(quad.object);
            if (objKey.tp === types_1.NodeType.Undefined) {
                continue;
            }
            if (qKey?.tp === objKey?.tp && qKey?.val === objKey?.val) {
                if (found) {
                    throw constants_1.MerklizationConstants.ERRORS.MULTIPLE_PARENTS_FOUND;
                }
                found = true;
                result = new dataset_idx_1.DatasetIdx(graphName, idx);
            }
        }
        return result;
    }
    static findGraphParent(ds, q) {
        if (!q.graph) {
            return undefined;
        }
        const qKey = ref_tp_1.RefTp.getRefFromQuad(q.graph);
        if (qKey.tp === types_1.NodeType.Undefined) {
            return undefined;
        }
        if (qKey.tp !== types_1.NodeType.BlankNode) {
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
                const objKey = ref_tp_1.RefTp.getRefFromQuad(quad.object);
                if (objKey.tp === types_1.NodeType.Undefined) {
                    continue;
                }
                if (qKey.toString() == objKey.toString()) {
                    if (found) {
                        throw constants_1.MerklizationConstants.ERRORS.MULTIPLE_PARENTS_FOUND;
                    }
                    found = true;
                    result = new dataset_idx_1.DatasetIdx(graphName, idx);
                }
            }
        }
        if (found) {
            return result;
        }
        else {
            throw constants_1.MerklizationConstants.ERRORS.PARENT_NOT_FOUND;
        }
    }
}
exports.RDFDataset = RDFDataset;
// assert consistency of dataset and validate that only
// quads we support contains in dataset.
RDFDataset.assertDatasetConsistency = (ds) => {
    for (const [graph, quads] of ds.graphs) {
        for (const q of quads) {
            if (!graph) {
                throw new Error('empty graph name');
            }
            if (graph === constants_1.MerklizationConstants.DEFAULT_GRAPH_NODE_NAME && q.graph.id) {
                throw new Error('graph should be nil for @default graph');
            }
            if (!q.graph.id && graph !== constants_1.MerklizationConstants.DEFAULT_GRAPH_NODE_NAME) {
                throw new Error('graph should not be nil for non-@default graph');
            }
        }
    }
};
