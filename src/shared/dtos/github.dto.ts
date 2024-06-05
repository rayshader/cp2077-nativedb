export interface GitHubFileEntryDto {
  //readonly download_url: string;
  //readonly git_url: string;
  //readonly html_url: string;
  readonly name: string;
  readonly path: string;
  //readonly sha: string;
  //readonly size: number;
  readonly type: 'file';
  //readonly url: string;
}

export interface GitHubFileDto extends GitHubFileEntryDto {
  readonly content: string;
  readonly encoding: 'base64';
}
