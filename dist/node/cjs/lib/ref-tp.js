"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefTp = void 0;
const types_1 = require("./types/types");
class RefTp {
    constructor(tp, val) {
        this.tp = tp;
        this.val = val;
    }
    toString() {
        return JSON.stringify(this);
    }
    static getRefFromQuad(n) {
        if (n.termType === types_1.NodeType.IRI) {
            return new RefTp(types_1.NodeType.IRI, n.value);
        }
        if (n.termType === types_1.NodeType.BlankNode) {
            return new RefTp(types_1.NodeType.BlankNode, n.value);
        }
        return new RefTp(types_1.NodeType.Undefined, '');
    }
}
exports.RefTp = RefTp;
