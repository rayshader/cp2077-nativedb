import {Injectable} from "@angular/core";
import {map, Observable} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {GitHubClient} from "./github.client";
import {GitHubFileDto, GitHubFileEntryDto} from "../dtos/github.dto";
import {WikiFileDto, WikiFileEntryDto} from "../dtos/wiki.dto";

@Injectable({
  providedIn: 'root'
})
export class WikiClient extends GitHubClient {

  constructor(http: HttpClient) {
    super(http, 'CDPR-Modding-Documentation', 'NativeDB-wiki', 'NativeDB');
  }

  public getClass(name: string): Observable<WikiFileDto> {
    return this.getFileFrom(`classes/${name.toLowerCase()}.md`).pipe(
      map((file: GitHubFileDto) => {
        if (file.encoding !== 'base64') {
          throw new WikiEncodingError(file.encoding);
        }
        let markdown: string = atob(file.content);

        markdown = markdown.replaceAll(/---(.*\n)*---\n\n/gm, '');
        return {
          sha: file.sha,
          name: file.name,
          className: WikiClient.getClassName(file.name),
          path: file.path,
          markdown: markdown
        };
      })
    );
  }

  public getClasses(): Observable<WikiFileEntryDto[]> {
    return this.getFilesFrom('classes').pipe(
      map((files: GitHubFileEntryDto[]) => {
        return files.map((file) => {
          return {
            sha: file.sha,
            name: file.name,
            className: WikiClient.getClassName(file.name),
            path: file.path
          };
        })
      })
    );
  }

  private static getClassName(fileName: string): string {
    return fileName.substring(0, fileName.indexOf('.md'));
  }

}

export class WikiEncodingError extends Error {

  constructor(public readonly encoding: string) {
    super();
  }
}
