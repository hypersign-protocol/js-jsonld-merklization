"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MtValue = void 0;
const constants_1 = require("./constants");
const poseidon_1 = require("./poseidon");
const polyfill_1 = require("@js-temporal/polyfill");
const utils_1 = require("./utils");
const bytesEncoder = new TextEncoder();
class MtValue {
    constructor(value, h = poseidon_1.DEFAULT_HASHER) {
        this.value = value;
        this.h = h;
    }
    isString() {
        return typeof this.value === 'string';
    }
    asString() {
        if (!this.isString()) {
            throw constants_1.MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
        }
        return this.value.toString();
    }
    isTime() {
        return this.value instanceof polyfill_1.Temporal.Instant;
    }
    asTime() {
        if (!this.isTime()) {
            throw constants_1.MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
        }
        return this.value;
    }
    isNumber() {
        return typeof this.value === 'number';
    }
    asNumber() {
        if (!this.isNumber()) {
            throw constants_1.MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
        }
        return this.value;
    }
    isBool() {
        return typeof this.value === 'boolean';
    }
    asBool() {
        if (!this.isBool()) {
            throw constants_1.MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
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
            throw constants_1.MerklizationConstants.ERRORS.MT_VALUE_INCORRECT_TYPE;
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
exports.MtValue = MtValue;
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
            if (v instanceof polyfill_1.Temporal.Instant) {
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
        const { min } = (0, utils_1.minMaxFromPrime)(prime);
        if (v < min) {
            throw new Error(`value is too small: ${v}`);
        }
        return v + prime;
    }
    return v;
};
