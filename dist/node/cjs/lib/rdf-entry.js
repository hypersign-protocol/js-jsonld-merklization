"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDFEntry = void 0;
/* eslint-disable no-case-declarations */
const constants_1 = require("./constants");
const types_1 = require("./types/types");
const mt_value_1 = require("./mt-value");
const poseidon_1 = require("./poseidon");
const utils_1 = require("./utils");
const rdf_dataset_1 = require("./rdf-dataset");
const relationship_1 = require("./relationship");
const dataset_idx_1 = require("./dataset-idx");
const quad_arr_key_1 = require("./quad-arr-key");
const polyfill_1 = require("@js-temporal/polyfill");
class RDFEntry {
    constructor(key, value, dataType = '', hasher = poseidon_1.DEFAULT_HASHER) {
        this.key = key;
        this.value = value;
        this.dataType = dataType;
        this.hasher = hasher;
        if (!key.parts.length) {
            throw new Error('key length is zero');
        }
        (0, utils_1.validateValue)(value);
    }
    getHasher() {
        return this.hasher;
    }
    getKeyMtEntry() {
        return this.key.mtEntry();
    }
    getValueMtEntry() {
        return mt_value_1.MtValue.mkValueMtEntry(this.getHasher(), this.value);
    }
    async getKeyValueMTEntry() {
        const k = await this.getKeyMtEntry();
        const v = await this.getValueMtEntry();
        return { k, v };
    }
    static async fromDataSet(ds, hasher = poseidon_1.DEFAULT_HASHER) {
        rdf_dataset_1.RDFDataset.assertDatasetConsistency(ds);
        const quads = ds.graphs.get(constants_1.MerklizationConstants.DEFAULT_GRAPH_NODE_NAME);
        if (!quads.length) {
            throw new Error('@default graph not found in dataset');
        }
        const rs = await relationship_1.Relationship.newRelationship(ds, hasher);
        const entries = [];
        const graphProcessor = (graphName, quads) => {
            const counts = quad_arr_key_1.QuadArrKey.countEntries(quads);
            const seenCount = new Map();
            for (let quadIdx = 0; quadIdx < quads.length; quadIdx++) {
                let dataType = '';
                const q = quads[quadIdx];
                const quadGraphIdx = new dataset_idx_1.DatasetIdx(graphName, quadIdx);
                const qKey = new quad_arr_key_1.QuadArrKey(q);
                let value;
                const qo = q.object.termType;
                const qoVal = q.object.value;
                switch (qo) {
                    case types_1.NodeType.Literal:
                        dataType = q?.object?.datatype?.value;
                        value = (0, utils_1.convertStringToXsdValue)(dataType, qoVal, hasher.prime());
                        break;
                    case types_1.NodeType.IRI:
                        if (!qo) {
                            throw new Error('object IRI is nil');
                        }
                        value = qoVal;
                        break;
                    case types_1.NodeType.BlankNode:
                        const p = rs.children.get(qKey.toString());
                        if (p) {
                            // this node is a reference to known parent,
                            // skip it and do not put it into merkle tree because it
                            // will be used as parent for other nodes, but has
                            // no value to put itself.
                            continue;
                        }
                        throw new Error('BlankNode is not supported yet');
                    case 'Variable':
                        value = qoVal;
                        break;
                    default:
                        throw new Error("unexpected Quad's Object type");
                }
                const count = counts.get(qKey.toString());
                let idx;
                switch (count) {
                    case 0:
                        throw new Error('[assertion] key not found in counts');
                    case 1:
                        // leave idx nil: only one element, do not consider it as an array
                        break;
                    default:
                        const key = qKey.toString();
                        idx = seenCount.get(key) ?? 0;
                        seenCount.set(key, idx + 1);
                }
                const path = rs.path(quadGraphIdx, ds, idx);
                const e = new RDFEntry(path, value, dataType, hasher);
                entries.push(e);
            }
        };
        rdf_dataset_1.RDFDataset.iterGraphsOrdered(ds, graphProcessor);
        return entries;
    }
}
exports.RDFEntry = RDFEntry;
RDFEntry.newRDFEntry = (k, v) => {
    const e = new RDFEntry(k, v);
    switch (typeof v) {
        case 'number':
        case 'string':
        case 'boolean':
            e.value = v;
            break;
        default:
            if (v instanceof polyfill_1.Temporal.Instant) {
                e.value = v;
            }
            else {
                throw new Error(`error: incorrect value type ${typeof v}`);
            }
    }
    return e;
};
