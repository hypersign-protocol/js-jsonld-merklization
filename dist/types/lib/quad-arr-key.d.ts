import { Quad } from 'n3';
import { RefTp } from './ref-tp';
export declare class QuadArrKey {
    subject: RefTp;
    predicate: unknown;
    graph: string;
    constructor(q: Quad);
    toString(): string;
    static countEntries: (nodes: Quad[]) => Map<string, number>;
}
