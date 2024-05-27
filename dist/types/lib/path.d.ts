import { Hasher, Options, Parts, ParsedCtx } from './types/types';
export declare class Path {
    parts: Parts;
    hasher: Hasher;
    constructor(parts?: Parts, hasher?: Hasher);
    reverse(): Parts;
    append(p: Parts): void;
    prepend(p: Parts): void;
    mtEntry(): Promise<bigint>;
    pathFromContext(docStr: string, path: string, opts?: Options): Promise<void>;
    typeFromContext(ctxStr: string, path: string, opts?: Options): Promise<string>;
    private static getTypeMapping;
    static newPath: (parts: Parts) => Path;
    private static pathFromDocument;
    static newPathFromCtx(docStr: string, path: string, opts?: Options): Promise<Path>;
    static getContextPathKey: (docStr: string, ctxTyp: string, fieldPath: string, opts?: Options) => Promise<Path>;
    static fromDocument(ldCTX: ParsedCtx | null, docStr: string, path: string, opts?: Options): Promise<Path>;
    static newTypeFromContext(contextStr: string, path: string, opts?: Options): Promise<string>;
    static getTypeIDFromContext(ctxStr: string, typeName: string, opts?: Options): Promise<string>;
}
