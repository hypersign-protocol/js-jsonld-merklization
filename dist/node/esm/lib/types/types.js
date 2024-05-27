export var NodeType;
(function (NodeType) {
    NodeType["BlankNode"] = "BlankNode";
    NodeType["IRI"] = "NamedNode";
    NodeType["Literal"] = "Literal";
    NodeType["Undefined"] = "Undefined";
})(NodeType || (NodeType = {}));
export var XSDNS;
(function (XSDNS) {
    XSDNS["Boolean"] = "http://www.w3.org/2001/XMLSchema#boolean";
    XSDNS["Integer"] = "http://www.w3.org/2001/XMLSchema#integer";
    XSDNS["NonNegativeInteger"] = "http://www.w3.org/2001/XMLSchema#nonNegativeInteger";
    XSDNS["NonPositiveInteger"] = "http://www.w3.org/2001/XMLSchema#nonPositiveInteger";
    XSDNS["NegativeInteger"] = "http://www.w3.org/2001/XMLSchema#negativeInteger";
    XSDNS["PositiveInteger"] = "http://www.w3.org/2001/XMLSchema#positiveInteger";
    XSDNS["DateTime"] = "http://www.w3.org/2001/XMLSchema#dateTime";
    XSDNS["Double"] = "http://www.w3.org/2001/XMLSchema#double";
})(XSDNS || (XSDNS = {}));
export const isDouble = (v) => String(v).includes('.') || Math.abs(v) >= 1e21;
export const canonicalDouble = (v) => v.toExponential(15).replace(/(\d)0*e\+?/, '$1E');
