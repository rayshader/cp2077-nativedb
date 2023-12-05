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
  readonly kind: RedNodeKind;
}
