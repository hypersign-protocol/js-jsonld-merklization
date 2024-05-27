"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Path = void 0;
const constants_1 = require("./constants");
const jsonld_1 = require("jsonld");
const poseidon_1 = require("./poseidon");
const utils_1 = require("./utils");
const options_1 = require("./options");
class Path {
    constructor(parts = [], hasher = poseidon_1.DEFAULT_HASHER) {
        this.parts = parts;
        this.hasher = hasher;
    }
    reverse() {
        return this.parts.reverse();
    }
    append(p) {
        this.parts = [...this.parts, ...p];
    }
    prepend(p) {
        this.parts = [...p, ...this.parts];
    }
    async mtEntry() {
        const h = this.hasher ?? poseidon_1.DEFAULT_HASHER;
        const keyParts = new Array(this.parts.length).fill(BigInt(0));
        for (let i = 0; i < this.parts.length; i += 1) {
            const p = this.parts[i];
            if (typeof p === 'string') {
                const b = utils_1.byteEncoder.encode(p);
                keyParts[i] = await h.hashBytes(b);
            }
            else if (typeof p === 'number') {
                keyParts[i] = BigInt(p);
            }
            else {
                throw new Error(`error: unexpected type ${typeof p}`);
            }
        }
        return h.hash(keyParts);
    }
    async pathFromContext(docStr, path, opts) {
        const doc = JSON.parse(docStr);
        if (!doc['@context']) {
            throw constants_1.MerklizationConstants.ERRORS.CONTEXT_NOT_DEFINED;
        }
        const jsonldOpts = { documentLoader: (0, options_1.getDocumentLoader)(opts) };
        const emptyCtx = await (0, jsonld_1.processContext)(null, null, jsonldOpts);
        let parsedCtx = await (0, jsonld_1.processContext)(emptyCtx, doc, jsonldOpts);
        const parts = path.split('.');
        for (const i in parts) {
            const p = parts[i];
            if (constants_1.MerklizationConstants.DIGITS_ONLY_REGEX.test(p)) {
                this.parts.push(parseInt(p));
            }
            else {
                const m = parsedCtx.mappings.get(p);
                if (typeof m !== 'object') {
                    throw constants_1.MerklizationConstants.ERRORS.TERM_IS_NOT_DEFINED;
                }
                const id = m['@id'];
                if (!id) {
                    throw constants_1.MerklizationConstants.ERRORS.NO_ID_ATTR;
                }
                const nextCtx = m['@context'];
                if (nextCtx) {
                    parsedCtx = await (0, jsonld_1.processContext)(parsedCtx, m, jsonldOpts);
                }
                this.parts.push(id);
            }
        }
    }
    async typeFromContext(ctxStr, path, opts) {
        const ctxObj = JSON.parse(ctxStr);
        if (!('@context' in ctxObj)) {
            throw constants_1.MerklizationConstants.ERRORS.PARSED_CONTEXT_IS_NULL;
        }
        const jsonldOpts = { documentLoader: (0, options_1.getDocumentLoader)(opts) };
        const emptyCtx = await (0, jsonld_1.processContext)(null, null, jsonldOpts);
        let parsedCtx = await (0, jsonld_1.processContext)(emptyCtx, ctxObj, jsonldOpts);
        const parts = path.split('.');
        for (const i in parts) {
            const p = parts[i];
            const expP = expandType(parsedCtx, p);
            if (expP.hasContext) {
                parsedCtx = await (0, jsonld_1.processContext)(parsedCtx, expP.typeDef, jsonldOpts);
            }
            this.parts.push(expP['@id']);
        }
        return Path.getTypeMapping(parsedCtx, parts[parts.length - 1]);
    }
    static getTypeMapping(ctx, prop) {
        let rval = '';
        const defaultT = ctx.mappings.get('@type');
        if (defaultT) {
            rval = defaultT;
        }
        const propDef = ctx.mappings.get(prop);
        if (propDef && propDef['@type']) {
            rval = propDef['@type'];
        }
        return rval;
    }
    static async pathFromDocument(ldCTX, doc, pathParts, acceptArray, opts) {
        if (pathParts.length === 0) {
            return [];
        }
        const term = pathParts[0];
        const newPathParts = pathParts.slice(1);
        const jsonldOpts = { documentLoader: (0, options_1.getDocumentLoader)(opts) };
        if (constants_1.MerklizationConstants.DIGITS_ONLY_REGEX.test(term)) {
            const num = parseInt(term);
            const moreParts = await Path.pathFromDocument(ldCTX, doc, newPathParts, true, opts);
            return [num, ...moreParts];
        }
        if (typeof doc !== 'object') {
            throw new Error(`error: expected type object got ${typeof doc}`);
        }
        if (Array.isArray(doc)) {
            if (!doc.length) {
                throw new Error("error: can't generate path on zero-sized array");
            }
            if (!acceptArray) {
                throw constants_1.MerklizationConstants.ERRORS.UNEXPECTED_ARR_ELEMENT;
            }
            return Path.pathFromDocument(ldCTX, doc[0], pathParts, false, opts);
        }
        if ('@context' in doc) {
            if (ldCTX) {
                ldCTX = await (0, jsonld_1.processContext)(ldCTX, doc, jsonldOpts);
            }
            else {
                const emptyCtx = await (0, jsonld_1.processContext)(null, null, jsonldOpts);
                ldCTX = await (0, jsonld_1.processContext)(emptyCtx, doc, jsonldOpts);
            }
        }
        const elemKeys = (0, utils_1.sortArr)(Object.keys(doc));
        const typedScopedCtx = ldCTX;
        for (const k in elemKeys) {
            const key = elemKeys[k];
            if (key !== '@type') {
                const keyCtx = ldCTX.mappings.get(key);
                if (typeof keyCtx !== 'object') {
                    continue;
                }
                if (keyCtx['@id'] !== '@type') {
                    continue;
                }
            }
            let types = [];
            if (Array.isArray(doc[key])) {
                doc[key].forEach((e) => {
                    if (typeof e !== 'string') {
                        throw new Error(`error: @type value must be an array of strings: ${typeof e}`);
                    }
                    types.push(e);
                    types = (0, utils_1.sortArr)(types);
                });
            }
            else if (typeof doc[key] === 'string') {
                types.push(doc[key]);
            }
            else {
                throw new Error(`error: unexpected @type field type: ${typeof doc[key]}`);
            }
            for (const tt of types) {
                const td = typedScopedCtx.mappings.get(tt);
                if (typeof td === 'object' && '@context' in td) {
                    ldCTX = await (0, jsonld_1.processContext)(ldCTX, td, jsonldOpts);
                }
            }
            break;
        }
        const expTerm = expandType(ldCTX, term);
        if (expTerm.hasContext) {
            if (ldCTX) {
                ldCTX = await (0, jsonld_1.processContext)(ldCTX, expTerm.typeDef, jsonldOpts);
            }
            else {
                const emptyCtx = await (0, jsonld_1.processContext)(null, null, jsonldOpts);
                ldCTX = await (0, jsonld_1.processContext)(emptyCtx, expTerm.typeDef, jsonldOpts);
            }
        }
        const moreParts = await Path.pathFromDocument(ldCTX, doc[term], newPathParts, true, opts);
        return [expTerm['@id'], ...moreParts];
    }
    static async newPathFromCtx(docStr, path, opts) {
        const p = new Path([], (0, options_1.getHasher)(opts));
        await p.pathFromContext(docStr, path, opts);
        return p;
    }
    static async fromDocument(ldCTX, docStr, path, opts) {
        const doc = JSON.parse(docStr);
        const pathParts = path.split('.');
        if (pathParts.length === 0) {
            throw constants_1.MerklizationConstants.ERRORS.FIELD_PATH_IS_EMPTY;
        }
        const p = await Path.pathFromDocument(ldCTX, doc, pathParts, false, opts);
        return new Path(p, (0, options_1.getHasher)(opts));
    }
    static async newTypeFromContext(contextStr, path, opts) {
        const p = new Path([], (0, options_1.getHasher)(opts));
        return await p.typeFromContext(contextStr, path, opts);
    }
    static async getTypeIDFromContext(ctxStr, typeName, opts) {
        const ctxObj = JSON.parse(ctxStr);
        const jsonldOpts = { documentLoader: (0, options_1.getDocumentLoader)(opts) };
        const emptyCtx = await (0, jsonld_1.processContext)(null, null, jsonldOpts);
        const parsedCtx = await (0, jsonld_1.processContext)(emptyCtx, ctxObj, jsonldOpts);
        const typeDef = parsedCtx.mappings.get(typeName);
        if (!typeDef) {
            throw new Error(`looks like ${typeName} is not a type`);
        }
        const typeID = typeDef['@id'];
        if (!typeID) {
            throw new Error(`@id attribute is not found for type ${typeName}`);
        }
        // const typeIDStr = typeID.(string)
        if (typeof typeID !== 'string') {
            throw new Error(`@id attribute is not a string for type ${typeName}`);
        }
        return typeID;
    }
}
exports.Path = Path;
_a = Path;
Path.newPath = (parts) => {
    const p = new Path();
    p.append(parts);
    return p;
};
Path.getContextPathKey = async (docStr, ctxTyp, fieldPath, opts) => {
    if (ctxTyp === '') {
        throw constants_1.MerklizationConstants.ERRORS.CTX_TYP_IS_EMPTY;
    }
    if (fieldPath === '') {
        throw constants_1.MerklizationConstants.ERRORS.FIELD_PATH_IS_EMPTY;
    }
    const fullPath = await Path.newPathFromCtx(docStr, `${ctxTyp}.${fieldPath}`, opts);
    const typePath = await Path.newPathFromCtx(docStr, ctxTyp, opts);
    return new Path(fullPath.parts.slice(typePath.parts.length));
};
function expandType(ctx, term) {
    const m = ctx.mappings.get(term);
    if (typeof m !== 'object') {
        throw constants_1.MerklizationConstants.ERRORS.TERM_IS_NOT_DEFINED;
    }
    const id = m['@id'];
    if (!id) {
        throw constants_1.MerklizationConstants.ERRORS.NO_ID_ATTR;
    }
    if (typeof id !== 'string') {
        throw new Error(`error: @id attr is not of type string: ${typeof id}`);
    }
    return {
        '@id': id,
        hasContext: '@context' in m,
        typeDef: m
    };
}
