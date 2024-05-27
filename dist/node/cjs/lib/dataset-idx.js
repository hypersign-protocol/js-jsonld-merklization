"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetIdx = void 0;
class DatasetIdx {
    constructor(graphName, idx) {
        this.graphName = graphName;
        this.idx = idx;
    }
    toString() {
        return `${this.graphName}:${this.idx}`;
    }
}
exports.DatasetIdx = DatasetIdx;
