export interface WikiFileEntryDto {
  readonly sha: string;
  readonly fileName: string;
  readonly className: string | 'GLOBALS';
  readonly path: string;
}

export interface WikiFileDto extends WikiFileEntryDto {
  readonly markdown: string;
}

export interface WikiClassDto {
  readonly id: number;
  readonly sha: string;
  readonly name: string;
  readonly comment: string;
  readonly functions: WikiFunctionDto[];
}

export interface WikiFunctionDto {
  readonly id: number;
  readonly name: string;
  readonly comment: string;
}

export interface WikiGlobalDto extends WikiFunctionDto {
  readonly sha: string;
}
