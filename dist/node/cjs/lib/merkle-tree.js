"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEntriesToMerkleTree = exports.getMerkleTreeInitParam = void 0;
const js_merkletree_1 = require("@iden3/js-merkletree");
const getMerkleTreeInitParam = (prefix = '', writable = true, maxLevels = 40) => {
    return {
        db: new js_merkletree_1.InMemoryDB((0, js_merkletree_1.str2Bytes)(prefix)),
        writable,
        maxLevels
    };
};
exports.getMerkleTreeInitParam = getMerkleTreeInitParam;
const addEntriesToMerkleTree = async (mt, entries) => {
    for (const e of entries) {
        const { k, v } = await e.getKeyValueMTEntry();
        await mt.add(k, v);
    }
};
exports.addEntriesToMerkleTree = addEntriesToMerkleTree;
