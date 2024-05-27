"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuadArrKey = void 0;
const utils_1 = require("./utils");
const types_1 = require("./types/types");
class QuadArrKey {
    constructor(q) {
        this.graph = (0, utils_1.getGraphName)(q);
        const s = q.subject;
        switch (s.termType) {
            case types_1.NodeType.IRI:
                this.subject = { tp: types_1.NodeType.IRI, val: s.value };
                break;
            case types_1.NodeType.BlankNode:
                this.subject = { tp: types_1.NodeType.BlankNode, val: s.value };
                break;
            default:
                throw new Error('invalid subject type');
        }
        if (q.predicate.termType !== types_1.NodeType.IRI) {
            throw new Error('invalid predicate type');
        }
        this.predicate = q.predicate.value;
    }
    toString() {
        return JSON.stringify(this);
    }
}
exports.QuadArrKey = QuadArrKey;
QuadArrKey.countEntries = (nodes) => {
    const res = new Map();
    for (const q of nodes) {
        const key = new QuadArrKey(q);
        let c = res.get(key.toString()) ?? 0;
        res.set(key.toString(), ++c);
    }
    return res;
};
