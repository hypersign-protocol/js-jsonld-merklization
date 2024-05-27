import { NodeType } from './types/types';
export class RefTp {
    constructor(tp, val) {
        this.tp = tp;
        this.val = val;
    }
    toString() {
        return JSON.stringify(this);
    }
    static getRefFromQuad(n) {
        if (n.termType === NodeType.IRI) {
            return new RefTp(NodeType.IRI, n.value);
        }
        if (n.termType === NodeType.BlankNode) {
            return new RefTp(NodeType.BlankNode, n.value);
        }
        return new RefTp(NodeType.Undefined, '');
    }
}
