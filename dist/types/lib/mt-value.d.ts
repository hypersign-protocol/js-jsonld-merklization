import { Hasher } from './types/types';
import { Value } from './types/types';
import { Temporal } from '@js-temporal/polyfill';
export declare class MtValue {
    readonly value: Value;
    private readonly h;
    constructor(value: Value, h?: Hasher);
    isString(): boolean;
    asString(): string;
    isTime(): boolean;
    asTime(): Temporal.Instant;
    isNumber(): boolean;
    asNumber(): number;
    isBool(): boolean;
    asBool(): boolean;
    mtEntry(): Promise<bigint>;
    isBigInt(): boolean;
    asBigInt(): bigint;
    static mkValueMtEntry: (h: Hasher, v: Value) => Promise<bigint>;
    static mkValueInt(h: Hasher, v: number | bigint): Promise<bigint>;
    static mkValueUInt: (h: Hasher, v: bigint) => bigint;
    static mkValueBool: (h: Hasher, v: boolean) => Promise<bigint>;
    static mkValueString: (h: Hasher, v: string) => Promise<bigint>;
    static mkValueTime: (h: Hasher, v: Temporal.Instant) => Promise<bigint>;
    static mkValueBigInt: (h: Hasher, v: bigint) => Promise<bigint>;
}
