import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";

export interface RedEnumJson {
  // name
  readonly a: string;

  // fields
  readonly i: RedEnumFieldJson[];
}

interface RedEnumFieldJson {
  // key = value
  readonly [key: string]: number;
}

export interface RedEnumAst extends RedNodeAst {
  readonly name: string;
  readonly fields: RedEnumFieldAst[];
}

export interface RedEnumFieldAst {
  readonly key: string;
  readonly value: number;
}

export class RedEnumAst {
  static fromJson(json: RedEnumJson): RedEnumAst {
    const fields: RedEnumFieldAst[] = [];

    for (const key of Object.keys(json.i)) {
      fields.push({
        key: key,
        // @ts-ignore
        value: json.i[key]
      });
    }
    return {
      id: cyrb53(json.a),
      kind: RedNodeKind.enum,
      name: json.a,
      fields: fields
    };
  }
}
