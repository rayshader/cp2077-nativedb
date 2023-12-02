import {cyrb53} from "../string";
import {RedNodeAst, RedNodeKind} from "./red-node.ast";

export interface RedAnnotationJson {
  // name
  readonly a: string;
  // key
  readonly b: string;
  // value
  readonly c: string;
}

export interface RedAnnotationAst extends RedNodeAst {
  readonly name: string;
  readonly key: string;
  readonly value: string;
}

export class RedAnnotationAst {
  static fromJson(json: RedAnnotationJson): RedAnnotationAst {
    return {
      id: cyrb53(json.a),
      kind: RedNodeKind.annotation,
      name: json.a,
      key: json.b,
      value: json.c
    };
  }
}
