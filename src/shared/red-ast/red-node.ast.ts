export enum RedNodeKind {
  annotation,
  argument,
  bitfield,
  class,
  enum,
  function,
  property,
  struct,
  type
}

export interface RedNodeAst {
  readonly id: number;
  readonly kind: RedNodeKind;
}
