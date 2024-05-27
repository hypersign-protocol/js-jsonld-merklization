import { Temporal } from '@js-temporal/polyfill';
import { DocumentLoader } from '../../loaders/jsonld-loader';
import { JsonLdDocument } from 'jsonld/jsonld';
import { Options as jsonLDOpts } from 'jsonld/jsonld-spec';
export interface Options {
    hasher?: Hasher;
    ipfsNodeURL?: string;
    ipfsGatewayURL?: string;
    documentLoader?: DocumentLoader;
}
export interface Hasher {
    hash: (inp: bigint[]) => Promise<bigint>;
    hashBytes: (b: Uint8Array) => Promise<bigint>;
    prime: () => bigint;
}
export declare enum NodeType {
    BlankNode = "BlankNode",
    IRI = "NamedNode",
    Literal = "Literal",
    Undefined = "Undefined"
}
export declare enum XSDNS {
    Boolean = "http://www.w3.org/2001/XMLSchema#boolean",
    Integer = "http://www.w3.org/2001/XMLSchema#integer",
    NonNegativeInteger = "http://www.w3.org/2001/XMLSchema#nonNegativeInteger",
    NonPositiveInteger = "http://www.w3.org/2001/XMLSchema#nonPositiveInteger",
    NegativeInteger = "http://www.w3.org/2001/XMLSchema#negativeInteger",
    PositiveInteger = "http://www.w3.org/2001/XMLSchema#positiveInteger",
    DateTime = "http://www.w3.org/2001/XMLSchema#dateTime",
    Double = "http://www.w3.org/2001/XMLSchema#double"
}
export declare const isDouble: (v: number) => boolean;
export declare const canonicalDouble: (v: number) => string;
export type Value = boolean | number | Temporal.Instant | string | bigint;
export type Parts = Array<string | number>;
export interface ParsedCtx {
    mappings: Map<string, object | string>;
}
declare module 'jsonld' {
    function processContext(activeCtx: ParsedCtx | null, localCtx: JsonLdDocument | null, opts: jsonLDOpts): Promise<ParsedCtx>;
}
