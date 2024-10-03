import {RedClassAst} from "./red-class.ast";

export enum RedNodeKind {
  enum,
  bitfield,
  class,
  struct,
  property,
  function,
  type
}

export interface RedNodeAst {
  readonly id: number;
  readonly name: string;
  readonly kind: RedNodeKind;

  // Define alias, when it exists, while loading data.
  aliasName?: string;
}

export function getRedNodeKindName(kind: RedNodeKind): string {
  const name: string = RedNodeKind[kind];

  return `${name[0].toUpperCase()}${name.substring(1)}`;
}

export class RedNodeAst {

  static testName(node: RedNodeAst, rule: RegExp): boolean {
    const name: string = node.name.toLowerCase();

    return rule.test(name);
  }

  static hasName(node: RedNodeAst, words: string[]): boolean {
    const name: string = node.name.toLowerCase();

    return words.every((word) => name.includes(word));
  }

  static isEmpty(node: RedNodeAst): boolean {
    if (node.kind !== RedNodeKind.class && node.kind !== RedNodeKind.struct) {
      return false;
    }
    const object: RedClassAst = node as unknown as RedClassAst;

    return object.properties.length === 0 && object.functions.length === 0;
  }

}
