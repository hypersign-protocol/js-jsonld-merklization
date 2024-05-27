export class DatasetIdx {
    constructor(graphName, idx) {
        this.graphName = graphName;
        this.idx = idx;
    }
    toString() {
        return `${this.graphName}:${this.idx}`;
    }
}
