export interface RedBitfieldJson {
  // name
  readonly a: string;

  // fields
  readonly i: RedBitfieldFieldJson[];
}

interface RedBitfieldFieldJson {
  // key = value
  readonly [key: string]: number;
}

export interface RedBitfieldAst {
  readonly name: string;
  readonly fields: RedBitfieldFieldAst[];
}

export interface RedBitfieldFieldAst {
  readonly key: string;
  readonly value: number;
}

export class RedBitfieldAst {
  static fromJson(json: RedBitfieldJson): RedBitfieldAst {
    const fields: RedBitfieldFieldAst[] = [];

    for (const key of Object.keys(json.i)) {
      fields.push({
        key: key,
        // @ts-ignore
        value: json.i[key]
      });
    }
    return {
      name: json.a,
      fields: fields
    };
  }
}
