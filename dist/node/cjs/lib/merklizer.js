"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Merklizer = void 0;
const jsonld_1 = require("jsonld");
const js_merkletree_1 = require("@iden3/js-merkletree");
const rdf_dataset_1 = require("./rdf-dataset");
const poseidon_1 = require("./poseidon");
const merkle_tree_1 = require("./merkle-tree");
const rdf_entry_1 = require("./rdf-entry");
const path_1 = require("./path");
const mt_value_1 = require("./mt-value");
const utils_1 = require("./utils");
const options_1 = require("./options");
class Merklizer {
    constructor(srcDoc = null, mt = null, hasher = poseidon_1.DEFAULT_HASHER, entries = new Map(), compacted = null, documentLoader = (0, options_1.getDocumentLoader)()) {
        this.srcDoc = srcDoc;
        this.mt = mt;
        this.hasher = hasher;
        this.entries = entries;
        this.compacted = compacted;
        this.documentLoader = documentLoader;
        if (!mt) {
            const { db, writable, maxLevels } = (0, merkle_tree_1.getMerkleTreeInitParam)();
            this.mt = new js_merkletree_1.Merkletree(db, writable, maxLevels);
        }
    }
    async proof(p) {
        const kHash = await p.mtEntry();
        const { proof } = await this.mt.generateProof(kHash);
        if (proof.existence) {
            if (!this.entries.has(kHash.toString())) {
                throw new Error('error: [assertion] no entry found while existence is true');
            }
            const entry = this.entries.get(kHash.toString());
            const value = new mt_value_1.MtValue(entry.value, this.hasher);
            return { proof, value };
        }
        return { proof };
    }
    mkValue(val) {
        return new mt_value_1.MtValue(val, this.hasher);
    }
    async resolveDocPath(path, opts) {
        const realPath = await path_1.Path.fromDocument(null, this.srcDoc, path, opts);
        realPath.hasher = this.hasher;
        return realPath;
    }
    async entry(path) {
        const key = await path.mtEntry();
        const e = this.entries.get(key.toString());
        if (!e) {
            throw new Error('entry not found');
        }
        return e;
    }
    // JSONLDType returns the JSON-LD type of the given path. If there is no literal
    // by this path, it returns an error.
    async jsonLDType(path) {
        const entry = await this.entry(path);
        return entry.dataType;
    }
    async root() {
        return this.mt.root();
    }
    rawValue(path) {
        let parts = path.parts;
        let obj = this.compacted;
        const traversedParts = [];
        const currentPath = () => traversedParts.join(' / ');
        while (parts.length > 0) {
            const p = parts[0];
            if (typeof p === 'string') {
                traversedParts.push(p);
                obj = obj[p] ?? obj['@graph'][p];
                if (!obj) {
                    throw new Error('value not found');
                }
            }
            else if (typeof p === 'number') {
                traversedParts.push(p.toString());
                obj = this.rvExtractArrayIdx(obj, p);
            }
            else {
                throw new Error(`unexpected type of path ${currentPath()}`);
            }
            parts = parts.slice(1);
        }
        if (typeof obj['@value'] !== 'undefined') {
            return obj['@value'];
        }
        return obj;
    }
    rvExtractArrayIdx(obj, idx) {
        const isArray = Array.isArray(obj);
        if (!isArray) {
            throw new Error('expected array');
        }
        if (idx < 0 || idx >= obj.length) {
            throw new Error('index is out of range');
        }
        return obj[idx];
    }
    static async merklizeJSONLD(docStr, opts) {
        const hasher = (0, options_1.getHasher)(opts);
        const documentLoader = (0, options_1.getDocumentLoader)(opts);
        const mz = new Merklizer(docStr, null, hasher, new Map(), null, documentLoader);
        const doc = JSON.parse(mz.srcDoc);
        const dataset = await rdf_dataset_1.RDFDataset.fromDocument(doc, documentLoader);
        const entries = await rdf_entry_1.RDFEntry.fromDataSet(dataset, hasher);
        for (const e of entries) {
            const k = await e.getKeyMtEntry();
            mz.entries.set(k.toString(), e);
        }
        await (0, merkle_tree_1.addEntriesToMerkleTree)(mz.mt, entries);
        mz.compacted = await (0, jsonld_1.compact)(doc, {}, { documentLoader, base: null, compactArrays: true, compactToRelative: true });
        return mz;
    }
    static async hashValue(dataType, value) {
        return this.hashValueWithHasher(poseidon_1.DEFAULT_HASHER, dataType, value);
    }
    static async hashValueWithHasher(h, dataType, value) {
        const valueStr = (0, utils_1.convertAnyToString)(value, dataType);
        const xsdValue = (0, utils_1.convertStringToXsdValue)(dataType, valueStr, h.prime());
        return await mt_value_1.MtValue.mkValueMtEntry(h, xsdValue);
    }
    get options() {
        return {
            hasher: this.hasher,
            documentLoader: this.documentLoader
        };
    }
}
exports.Merklizer = Merklizer;
