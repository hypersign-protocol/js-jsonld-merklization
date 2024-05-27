import { InMemoryDB, str2Bytes } from '@iden3/js-merkletree';
export const getMerkleTreeInitParam = (prefix = '', writable = true, maxLevels = 40) => {
    return {
        db: new InMemoryDB(str2Bytes(prefix)),
        writable,
        maxLevels
    };
};
export const addEntriesToMerkleTree = async (mt, entries) => {
    for (const e of entries) {
        const { k, v } = await e.getKeyValueMTEntry();
        await mt.add(k, v);
    }
};
