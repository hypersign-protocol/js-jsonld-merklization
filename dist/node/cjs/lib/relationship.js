"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Relationship = void 0;
const types_1 = require("./types/types");
const path_1 = require("./path");
const ref_tp_1 = require("./ref-tp");
const quad_arr_key_1 = require("./quad-arr-key");
const rdf_dataset_1 = require("./rdf-dataset");
const dataset_idx_1 = require("./dataset-idx");
const poseidon_1 = require("./poseidon");
class Relationship {
    constructor(
    // string should be derived from instance of NodeID for the below maps
    parents = new Map(), 
    // map[qArrKey]map[refTp]int
    children = new Map(), hasher = poseidon_1.DEFAULT_HASHER) {
        this.parents = parents;
        this.children = children;
        this.hasher = hasher;
    }
    static getIriValue(n) {
        if (n.predicate.termType === types_1.NodeType.IRI) {
            return n.predicate.value;
        }
        throw new Error('type is not IRI');
    }
    path(dsIdx, ds, idx) {
        const k = new path_1.Path([], this.hasher);
        if (typeof idx === 'number') {
            k.append([idx]);
        }
        const n = rdf_dataset_1.RDFDataset.getQuad(ds, dsIdx);
        const predicate = Relationship.getIriValue(n);
        k.append([predicate]);
        let nextKey = dsIdx;
        for (;;) {
            const parentIdx = this.parents.get(nextKey.toString());
            if (!parentIdx) {
                break;
            }
            const parent = rdf_dataset_1.RDFDataset.getQuad(ds, parentIdx);
            const parentKey = new quad_arr_key_1.QuadArrKey(parent);
            const childrenMap = this.children.get(parentKey.toString());
            if (!childrenMap) {
                throw new Error('parent mapping not found');
            }
            const childQuad = rdf_dataset_1.RDFDataset.getQuad(ds, nextKey);
            const childRef = ref_tp_1.RefTp.getRefFromQuad(childQuad.subject);
            const childIdx = childrenMap.get(childRef.toString());
            if (typeof childIdx !== 'number') {
                throw new Error('child not found in parents mapping');
            }
            const parentPredicate = Relationship.getIriValue(parent);
            if (childrenMap.size === 1) {
                k.append([parentPredicate]);
            }
            else {
                k.append([childIdx, parentPredicate]);
            }
            nextKey = parentIdx;
        }
        k.reverse();
        return k;
    }
    static async newRelationship(ds, hasher) {
        const r = new Relationship(new Map(), new Map(), hasher);
        rdf_dataset_1.RDFDataset.iterGraphsOrdered(ds, (graphName, quads) => {
            for (let idx = 0; idx < quads.length; idx++) {
                const q = quads[idx];
                const parentIdx = rdf_dataset_1.RDFDataset.findParent(ds, q);
                if (!parentIdx) {
                    continue;
                }
                const qIdx = new dataset_idx_1.DatasetIdx(graphName, idx);
                r.parents.set(qIdx.toString(), parentIdx);
                const parentQuad = rdf_dataset_1.RDFDataset.getQuad(ds, parentIdx);
                const qKey = new quad_arr_key_1.QuadArrKey(parentQuad);
                //string here is json representation of RefTp interface
                let childrenM = r.children.get(qKey.toString());
                if (!childrenM) {
                    childrenM = new Map();
                    r.children.set(qKey.toString(), childrenM);
                }
                const childRef = ref_tp_1.RefTp.getRefFromQuad(q.subject);
                const childExists = childrenM.get(childRef.toString());
                if (typeof childExists !== 'number') {
                    const nextIdx = childrenM.size;
                    childrenM.set(childRef.toString(), nextIdx);
                }
            }
        });
        return r;
    }
}
exports.Relationship = Relationship;
