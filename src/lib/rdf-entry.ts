import { Quad } from 'n3';
/* eslint-disable no-case-declarations */
import { MerklizationConstants } from './constants';
import { Path } from './path';
import { Hasher, NodeType, Value, XSDNS } from './types/types';
import { MtValue } from './mt-value';
import { DEFAULT_HASHER } from './poseidon';
import { validateValue } from './utils';
import { RDFDataset } from './rdf-dataset';
import { Relationship } from './relationship';
import { DatasetIdx } from './dataset-idx';
import { QuadArrKey } from './quad-arr-key';
import { Temporal } from 'temporal-polyfill'

export class RDFEntry {
  constructor(public key: Path, public value: Value, public hasher: Hasher = DEFAULT_HASHER) {
    if (!key.parts.length) {
      throw new Error('key length is zero');
    }
    validateValue(value);
  }

  getHasher(): Hasher {
    return this.hasher;
  }

  getKeyMtEntry(): Promise<bigint> {
    return this.key.mtEntry();
  }

  getValueMtEntry(): Promise<bigint> {
    return MtValue.mkValueMtEntry(this.getHasher(), this.value);
  }

  async getKeyValueMTEntry(): Promise<{ k: bigint; v: bigint }> {
    const k = await this.getKeyMtEntry();
    const v = await this.getValueMtEntry();
    return { k, v };
  }

  static newRDFEntry = (k: Path, v: Value) => {
    const e = new RDFEntry(k, v);
    switch (typeof v) {
      case 'number':
      case 'string':
      case 'boolean':
        e.value = v;
        break;
      default:
        if (v instanceof Temporal.Instant) {
          e.value = v;
        } else {
          throw new Error(`error: incorrect value type ${typeof v}`);
        }
    }
    return e;
  };

  static async fromDataSet(ds: RDFDataset, hasher: Hasher = DEFAULT_HASHER): Promise<RDFEntry[]> {
    RDFDataset.assertDatasetConsistency(ds);

    const quads = ds.graphs.get(MerklizationConstants.DEFAULT_GRAPH_NODE_NAME);
    if (!quads.length) {
      throw new Error('@default graph not found in dataset');
    }

    const rs = await Relationship.newRelationship(ds, hasher);
    const entries: RDFEntry[] = [];
    const graphProcessor = (graphName: string, quads: Quad[]): void => {
      const counts = QuadArrKey.countEntries(quads);
      const seenCount = new Map<string, number>();
      for (let quadIdx = 0; quadIdx < quads.length; quadIdx++) {
        const q = quads[quadIdx];
        const quadGraphIdx = new DatasetIdx(graphName, quadIdx);
        const qKey = new QuadArrKey(q);
        let value: Value;
        const qo = q.object.termType;
        const qoVal = q.object.value;

        switch (qo) {
          case NodeType.Literal:
            const dataType = q?.object?.datatype?.value;
            switch (dataType) {
              case XSDNS.Boolean:
                switch (qoVal) {
                  case 'false':
                    value = false;
                    break;
                  case 'true':
                    value = true;
                    break;
                  default:
                    throw new Error('incorrect boolean value');
                }
                break;
              case XSDNS.Integer:
              case XSDNS.NonNegativeInteger:
              case XSDNS.NonPositiveInteger:
              case XSDNS.NegativeInteger:
              case XSDNS.PositiveInteger:
                value = parseInt(qoVal);
                break;
              case XSDNS.DateTime:
                // e.value.ts = DateTime.fromISO("1958-07-17 00:00:00 +0000")
                if (isNaN(Date.parse(qoVal))) {
                  throw new Error(`error: error parsing time string ${qoVal}`);
                }
                const dateRegEx = /^\d{4}-\d{2}-\d{2}$/
                if (dateRegEx.test(qoVal)){
                  value =  Temporal.Instant.from(new Date(qoVal).toISOString())
                } else{
                  value =  Temporal.Instant.from(qoVal)
                }
                break;
              default:
                value = qoVal;
            }
            break;
          case NodeType.IRI:
            if (!qo) {
              throw new Error('object IRI is nil');
            }
            value = qoVal;
            break;
          case NodeType.BlankNode:
            const p = rs.children.get(qKey.toString());
            if (p) {
              // this node is a reference to known parent,
              // skip it and do not put it into merkle tree because it
              // will be used as parent for other nodes, but has
              // no value to put itself.
              continue;
            }
            throw new Error('BlankNode is not supported yet');
          case 'Variable':
            value = qoVal;
            break;
          default:
            throw new Error("unexpected Quad's Object type");
        }

        const count = counts.get(qKey.toString());
        let idx: number;
        switch (count) {
          case 0:
            throw new Error('[assertion] key not found in counts');
          case 1:
            // leave idx nil: only one element, do not consider it as an array
            break;
          default:
            const key = qKey.toString();
            idx = seenCount.get(key) ?? 0;
            seenCount.set(key, idx + 1);
        }

        const path = rs.path(quadGraphIdx, ds, idx);
        const e = new RDFEntry(path, value, hasher);
        entries.push(e);
      }
    };

    RDFDataset.iterGraphsOrdered(ds, graphProcessor);

    return entries;
  }
}
