export interface RedAnnotationJson {
  // name
  readonly a: string;
  // key
  readonly b: string;
  // value
  readonly c: string;
}

export interface RedAnnotationAst {
  readonly name: string;
  readonly key: string;
  readonly value: string;
}

export class RedAnnotationAst {
  static fromJson(json: RedAnnotationJson): RedAnnotationAst {
    return {
      name: json.a,
      key: json.b,
      value: json.c
    };
  }
}
