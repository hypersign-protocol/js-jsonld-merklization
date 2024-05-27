import { Quad } from 'n3';
import { NodeType } from './types/types';
export declare class RefTp {
    readonly tp: NodeType;
    readonly val: unknown;
    constructor(tp: NodeType, val: unknown);
    toString(): string;
    static getRefFromQuad(n: Quad): RefTp;
}
