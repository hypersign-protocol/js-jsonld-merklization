var _a;
import { MerklizationConstants } from './constants';
import { DEFAULT_HASHER } from './poseidon';
import { Temporal } from '@js-temporal/polyfill';
import { minMaxFromPrime } from './utils';
const bytesEncoder = new TextEncoder();
export class MtValue {
    constructor(value, h = DEFAULT_HASHER) {
        this.value = value;
        this.h = h;
    }
    isString() {
        return typeof this.value === 'string';
    }
    asString() {
        if (!this.isString()) {
            throw MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
        }
        return this.value.toString();
    }
    isTime() {
        return this.value instanceof Temporal.Instant;
    }
    asTime() {
        if (!this.isTime()) {
            throw MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
        }
        return this.value;
    }
    isNumber() {
        return typeof this.value === 'number';
    }
    asNumber() {
        if (!this.isNumber()) {
            throw MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
        }
        return this.value;
    }
    isBool() {
        return typeof this.value === 'boolean';
    }
    asBool() {
        if (!this.isBool()) {
            throw MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
        }
        return this.value;
    }
    mtEntry() {
        return MtValue.mkValueMtEntry(this.h, this.value);
    }
    isBigInt() {
        return typeof this.value === 'bigint';
    }
    asBigInt() {
        if (!this.isBigInt()) {
            throw MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
        }
        return this.value;
    }
    static async mkValueInt(h, v) {
        if (v >= 0) {
            return BigInt(v);
        }
        return h.prime() + BigInt(v);
    }
}
_a = MtValue;
MtValue.mkValueMtEntry = (h, v) => {
    switch (typeof v) {
        case 'number':
            return MtValue.mkValueInt(h, v);
        case 'string':
            return MtValue.mkValueString(h, v);
        case 'boolean':
            return MtValue.mkValueBool(h, v);
        case 'bigint':
            return MtValue.mkValueBigInt(h, v);
        default: {
            if (v instanceof Temporal.Instant) {
                return MtValue.mkValueTime(h, v);
            }
            throw new Error(`error: unexpected type ${typeof v}`);
        }
    }
};
MtValue.mkValueUInt = (h, v) => {
    return BigInt.asUintN(64, v);
};
MtValue.mkValueBool = (h, v) => {
    if (v) {
        return h.hash([BigInt.asIntN(64, BigInt(1))]);
    }
    return h.hash([BigInt.asIntN(64, BigInt(0))]);
};
MtValue.mkValueString = (h, v) => {
    return h.hashBytes(bytesEncoder.encode(v));
};
MtValue.mkValueTime = async (h, v) => {
    // convert unixTimeStamp from ms -> ns as in go implementation
    return _a.mkValueInt(h, v.epochNanoseconds);
};
MtValue.mkValueBigInt = async (h, v) => {
    const prime = h.prime();
    if (v >= prime) {
        throw new Error(`value is too big: ${v}`);
    }
    if (v < 0n) {
        const { min } = minMaxFromPrime(prime);
        if (v < min) {
            throw new Error(`value is too small: ${v}`);
        }
        return v + prime;
    }
    return v;
};
