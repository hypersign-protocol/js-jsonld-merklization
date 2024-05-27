/* eslint-disable no-case-declarations */
import { MerklizationConstants } from './constants';
import { NodeType } from './types/types';
import { MtValue } from './mt-value';
import { DEFAULT_HASHER } from './poseidon';
import { convertStringToXsdValue, validateValue } from './utils';
import { RDFDataset } from './rdf-dataset';
import { Relationship } from './relationship';
import { DatasetIdx } from './dataset-idx';
import { QuadArrKey } from './quad-arr-key';
import { Temporal } from '@js-temporal/polyfill';
export class RDFEntry {
    constructor(key, value, dataType = '', hasher = DEFAULT_HASHER) {
        this.key = key;
        this.value = value;
        this.dataType = dataType;
        this.hasher = hasher;
        if (!key.parts.length) {
            throw new Error('key length is zero');
        }
        validateValue(value);
    }
    getHasher() {
        return this.hasher;
    }
    getKeyMtEntry() {
        return this.key.mtEntry();
    }
    getValueMtEntry() {
        return MtValue.mkValueMtEntry(this.getHasher(), this.value);
    }
    async getKeyValueMTEntry() {
        const k = await this.getKeyMtEntry();
        const v = await this.getValueMtEntry();
        return { k, v };
    }
    static async fromDataSet(ds, hasher = DEFAULT_HASHER) {
        RDFDataset.assertDatasetConsistency(ds);
        const quads = ds.graphs.get(MerklizationConstants.DEFAULT_GRAPH_NODE_NAME);
        if (!quads.length) {
            throw new Error('@default graph not found in dataset');
        }
        const rs = await Relationship.newRelationship(ds, hasher);
        const entries = [];
        const graphProcessor = (graphName, quads) => {
            const counts = QuadArrKey.countEntries(quads);
            const seenCount = new Map();
            for (let quadIdx = 0; quadIdx < quads.length; quadIdx++) {
                let dataType = '';
                const q = quads[quadIdx];
                const quadGraphIdx = new DatasetIdx(graphName, quadIdx);
                const qKey = new QuadArrKey(q);
                let value;
                const qo = q.object.termType;
                const qoVal = q.object.value;
                switch (qo) {
                    case NodeType.Literal:
                        dataType = q?.object?.datatype?.value;
                        value = convertStringToXsdValue(dataType, qoVal, hasher.prime());
                        break;
                    case NodeType.IRI:
                        if (!qo) {
                            throw new Error('object IRI is nil');
                        }
                        value = qoVal;
                        break;
                    case NodeType.BlankNode:
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
        RDFDataset.iterGraphsOrdered(ds, graphProcessor);
        return entries;
    }
}
RDFEntry.newRDFEntry = (k, v) => {
    const e = new RDFEntry(k, v);
    switch (typeof v) {
        case 'number':
        case 'string':
        case 'boolean':
            e.value = v;
            break;
        default:
            if (v instanceof Temporal.Instant) {
                e.value = v;
            }
            else {
                throw new Error(`error: incorrect value type ${typeof v}`);
            }
    }
    return e;
};
