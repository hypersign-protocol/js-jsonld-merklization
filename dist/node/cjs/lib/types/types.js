"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalDouble = exports.isDouble = exports.XSDNS = exports.NodeType = void 0;
var NodeType;
(function (NodeType) {
    NodeType["BlankNode"] = "BlankNode";
    NodeType["IRI"] = "NamedNode";
    NodeType["Literal"] = "Literal";
    NodeType["Undefined"] = "Undefined";
})(NodeType = exports.NodeType || (exports.NodeType = {}));
var XSDNS;
(function (XSDNS) {
    XSDNS["Boolean"] = "http://www.w3.org/2001/XMLSchema#boolean";
    XSDNS["Integer"] = "http://www.w3.org/2001/XMLSchema#integer";
    XSDNS["NonNegativeInteger"] = "http://www.w3.org/2001/XMLSchema#nonNegativeInteger";
    XSDNS["NonPositiveInteger"] = "http://www.w3.org/2001/XMLSchema#nonPositiveInteger";
    XSDNS["NegativeInteger"] = "http://www.w3.org/2001/XMLSchema#negativeInteger";
    XSDNS["PositiveInteger"] = "http://www.w3.org/2001/XMLSchema#positiveInteger";
    XSDNS["DateTime"] = "http://www.w3.org/2001/XMLSchema#dateTime";
    XSDNS["Double"] = "http://www.w3.org/2001/XMLSchema#double";
})(XSDNS = exports.XSDNS || (exports.XSDNS = {}));
const isDouble = (v) => String(v).includes('.') || Math.abs(v) >= 1e21;
exports.isDouble = isDouble;
const canonicalDouble = (v) => v.toExponential(15).replace(/(\d)0*e\+?/, '$1E');
exports.canonicalDouble = canonicalDouble;
