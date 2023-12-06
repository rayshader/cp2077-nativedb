import {RedNodeAst, RedNodeKind} from "./red-node.ast";
import {cyrb53} from "../string";
import {RedEnumJson, RedEnumMemberAst} from "./red-enum.ast";

export interface RedBitfieldJson extends RedEnumJson {

}

export interface RedBitfieldAst extends RedNodeAst {
  //readonly name: string;
  readonly members: RedBitfieldMemberAst[];
}

export interface RedBitfieldMemberAst extends RedEnumMemberAst {
}

export class RedBitfieldAst {
  static sort(a: RedBitfieldAst, b: RedBitfieldAst): number {
    return a.name.localeCompare(b.name);
  }

  static fromJson(json: RedBitfieldJson): RedBitfieldAst {
    return {
      id: cyrb53(json.a),
      kind: RedNodeKind.bitfield,
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
