import {map, Observable, OperatorFunction, pipe, throwError} from "rxjs";
import {HttpClient, HttpHeaders, HttpResponse} from "@angular/common/http";
import {GitHubFileDto, GitHubFileEntryDto} from "../dtos/github.dto";

export class GitHubClient {

  private readonly headers: { [key: string]: string };

  private rateLimit?: GitHubRateLimit;

  protected constructor(private readonly http: HttpClient,
                        private readonly owner: string,
                        private readonly repo: string,
                        private readonly userAgent: string) {
    this.headers = {'X-GitHub-Api-Version': '2022-11-28'};
    this.headers['User-Agent'] = this.userAgent;
  }

  protected getFileFrom(path: string): Observable<GitHubFileDto> {
    if (this.rateLimit && !this.rateLimit.canRequest) {
      return throwError(() => new GitHubRateLimitError(this.rateLimit!));
    }
    return this.http.get<GitHubFileDto>(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`, {
      headers: this.headers,
      observe: 'response',
      responseType: 'json',
    }).pipe(this.interceptResponse());
  }

  protected getFilesFrom(path: string): Observable<GitHubFileEntryDto[]> {
    if (this.rateLimit && !this.rateLimit.canRequest) {
      return throwError(() => new GitHubRateLimitError(this.rateLimit!));
    }
    return this.http.get(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}`, {
      headers: this.headers,
      observe: 'response',
      responseType: 'json',
    }).pipe(this.interceptResponse());
  }

  private interceptResponse<T>(): OperatorFunction<HttpResponse<any>, T> {
    return pipe(
      map((response: HttpResponse<T>) => {
        const rateLimit: GitHubRateLimit = new GitHubRateLimit(response.headers);

        if (!this.rateLimit || this.rateLimit.isExpired(rateLimit)) {
          this.rateLimit = rateLimit;
        }
        if (!response.ok) {
          throw response;
        }
        return response.body!;
      })
    );
  }

}

export class GitHubRateLimitError extends Error {

  constructor(public readonly rateLimit: GitHubRateLimit) {
    super();
  }
}

export class GitHubRateLimit {
  // The maximum number of requests that you can make per hour.
  readonly limit: number;

  // The number of requests remaining in the current rate limit window.
  readonly remaining: number;

  // The number of requests you have made in the current rate limit window.
  readonly used: number;

  // The time at which the current rate limit window resets, in UTC epoch.
  readonly reset: Date;

  // The rate limit resource that the request counted against.
  readonly resource: string;

  constructor(headers: HttpHeaders) {
    this.limit = +headers.get('x-ratelimit-limit')!;
    this.remaining = +headers.get('x-ratelimit-remaining')!;
    this.used = +headers.get('x-ratelimit-used')!;
    this.reset = new Date(+headers.get('x-ratelimit-reset')! * 1000);
    this.resource = headers.get('x-ratelimit-resource')!;
  }

  public get canRequest(): boolean {
    return !this.isLimitReached() || this.isLimitReset();
  }

  public isLimitReached(): boolean {
    return this.remaining === 0;
  }

  public isLimitReset(): boolean {
    const now: Date = new Date();

    return now >= this.reset;
  }

  public isExpired(other: GitHubRateLimit): boolean {
    return this.remaining > other.remaining || this.reset < other.reset;
  }
}
