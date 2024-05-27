"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertAnyToString = exports.convertStringToXsdValue = exports.minMaxByXSDType = exports.minMaxFromPrime = exports.validateValue = exports.byteEncoder = exports.sortArr = exports.getGraphName = void 0;
const constants_1 = require("./constants");
const types_1 = require("./types/types");
const polyfill_1 = require("@js-temporal/polyfill");
function getGraphName(q) {
    if (!q.graph.value) {
        return constants_1.MerklizationConstants.DEFAULT_GRAPH_NODE_NAME;
    }
    if (q.graph.termType !== 'BlankNode') {
        throw new Error('graph node is not of BlankNode type');
    }
    return q.graph.value;
}
exports.getGraphName = getGraphName;
const sortArr = (arr) => {
    return arr.sort((a, b) => {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    });
};
exports.sortArr = sortArr;
exports.byteEncoder = new TextEncoder();
const validateValue = (val) => {
    switch (typeof val) {
        case 'boolean':
        case 'string':
        case 'bigint':
        case 'number':
            return;
        case 'object':
            if (val instanceof polyfill_1.Temporal.Instant) {
                return;
            }
    }
    throw new Error(`unexpected value type ${typeof val}, expected boolean | number | Temporal.Instant | string`);
};
exports.validateValue = validateValue;
const minMaxFromPrime = (prime) => {
    const max = prime / 2n;
    const min = max - prime + 1n;
    return { min, max };
};
exports.minMaxFromPrime = minMaxFromPrime;
// return included minimum and included maximum values for integers by XSD type
function minMaxByXSDType(xsdType, prime) {
    switch (xsdType) {
        case types_1.XSDNS.PositiveInteger:
            return { min: 1n, max: prime - 1n };
        case types_1.XSDNS.NonNegativeInteger:
            return { min: 0n, max: prime - 1n };
        case types_1.XSDNS.Integer:
            return (0, exports.minMaxFromPrime)(prime);
        case types_1.XSDNS.NegativeInteger:
            return { min: (0, exports.minMaxFromPrime)(prime).min, max: -1n };
        case types_1.XSDNS.NonPositiveInteger:
            return { min: (0, exports.minMaxFromPrime)(prime).min, max: 0n };
        default:
            throw new Error(`unsupported XSD type: ${xsdType}`);
    }
}
exports.minMaxByXSDType = minMaxByXSDType;
const convertStringToXsdValue = (dataType, valueStr, maxFieldValue) => {
    switch (dataType) {
        case types_1.XSDNS.Boolean:
            switch (valueStr) {
                case 'false':
                case '0':
                    return false;
                case 'true':
                case '1':
                    return true;
                default:
                    throw new Error('incorrect boolean value');
            }
        case types_1.XSDNS.Integer:
        case types_1.XSDNS.NonNegativeInteger:
        case types_1.XSDNS.NonPositiveInteger:
        case types_1.XSDNS.NegativeInteger:
        case types_1.XSDNS.PositiveInteger:
            const int = BigInt(valueStr);
            const { min, max } = minMaxByXSDType(dataType, maxFieldValue);
            if (int > max) {
                throw new Error(`integer exceeds maximum value: ${int}`);
            }
            if (int < min) {
                throw new Error(`integer is below minimum value: ${int}`);
            }
            return int;
        case types_1.XSDNS.DateTime: {
            if (isNaN(Date.parse(valueStr))) {
                throw new Error(`error: error parsing time string ${valueStr}`);
            }
            const dateRegEx = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegEx.test(valueStr)) {
                return polyfill_1.Temporal.Instant.from(new Date(valueStr).toISOString());
            }
            return polyfill_1.Temporal.Instant.from(valueStr);
        }
        case types_1.XSDNS.Double:
            return (0, types_1.canonicalDouble)(parseFloat(valueStr));
        default:
            return valueStr;
    }
};
exports.convertStringToXsdValue = convertStringToXsdValue;
const convertAnyToString = (v, datatype) => {
    const isDoubleType = datatype === types_1.XSDNS.Double;
    switch (typeof v) {
        case 'string':
            return isDoubleType ? (0, types_1.canonicalDouble)(parseFloat(v)) : v;
        case 'boolean':
            return `${v}`;
        case 'number': {
            return isDoubleType ? (0, types_1.canonicalDouble)(v) : `${v}`;
        }
        default:
            throw new Error('unsupported type');
    }
};
exports.convertAnyToString = convertAnyToString;
