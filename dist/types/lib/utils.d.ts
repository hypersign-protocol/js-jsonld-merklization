import { Quad } from 'n3';
import { Value } from './types/types';
export declare function getGraphName(q: Quad): string;
export declare const sortArr: <T>(arr: T[]) => T[];
export declare const byteEncoder: TextEncoder;
export declare const validateValue: (val: Value) => void;
export interface Range {
    min: bigint;
    max: bigint;
}
export declare const minMaxFromPrime: (prime: bigint) => Range;
export declare function minMaxByXSDType(xsdType: string, prime: bigint): Range;
export declare const convertStringToXsdValue: (dataType: string, valueStr: string, maxFieldValue: bigint) => Value;
export declare const convertAnyToString: (v: unknown, datatype: string) => string;
