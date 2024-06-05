export interface WikiFileEntryDto {
  readonly name: string;
  readonly className: string;
  readonly path: string;
}

export interface WikiFileDto extends WikiFileEntryDto {
  readonly markdown: string;
}

export interface WikiClassDto {
  readonly id: number;
  readonly name: string;
  readonly comment: string;
  readonly functions: WikiFunctionDto[];
}

export interface WikiFunctionDto {
  readonly id: number;
  readonly prototype: string;
  readonly name: string;
  readonly comment: string;
}
