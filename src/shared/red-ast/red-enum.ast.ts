import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";

export interface RedEnumJson {
  readonly a: string; // name
  readonly b: RedEnumMemberJson[]; // members
}

export interface RedEnumMemberJson {
  readonly [key: string]: number; // name: value OR name: bit
}

export interface RedEnumAst extends RedNodeAst {
  //readonly name: string;
  readonly members: RedEnumMemberAst[];
}

export interface RedEnumMemberAst {
  readonly key: string;
  readonly value: number;
}

export class RedEnumAst {
  static sort(a: RedEnumAst, b: RedEnumAst): number {
    return a.name.localeCompare(b.name);
  }

  static fromJson(json: RedEnumJson): RedEnumAst {
    return {
      id: cyrb53(json.a),
      kind: RedNodeKind.enum,
      name: json.a,
      members: json.b.map((member) => {
        const key: string = Object.keys(member)[0];

        return {
          key: key,
          value: member[key]
        };
      })
    };
  }
}
