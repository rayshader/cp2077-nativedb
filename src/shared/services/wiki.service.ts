import {Injectable} from "@angular/core";
import {WikiClient} from "../clients/wiki.client";
import {WikiParser} from "../parsers/wiki.parser";
import {WikiClassDto, WikiFileDto, WikiFileEntryDto} from "../dtos/wiki.dto";
import {
  catchError,
  combineLatestWith,
  expand,
  map,
  Observable,
  of,
  OperatorFunction,
  pipe,
  shareReplay,
  switchMap,
  timer
} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {GitHubRateLimitError} from "../clients/github.client";
import {WikiRepository} from "../repositories/wiki.repository";

@Injectable({
  providedIn: 'root'
})
export class WikiService {

  private readonly classes$: Observable<WikiFileEntryDto[]>;

  private readonly invalidationDelay: number = 10 * 60 * 1000;
  private readonly nextErrorAt: Date;

  constructor(private readonly wikiRepository: WikiRepository,
              private readonly wikiClient: WikiClient,
              private readonly wikiParser: WikiParser,
              private readonly toast: MatSnackBar) {
    this.classes$ = this.wikiClient.getClasses().pipe(this.invalidateClasses());
    this.nextErrorAt = new Date();
  }

  public getClass(name: string): Observable<WikiClassDto | undefined> {
    return this.findClass(name).pipe(
      combineLatestWith(this.wikiRepository.findByName(name)),
      switchMap(([file, cache]: [WikiFileEntryDto | undefined, WikiClassDto | undefined]) => {
        if (!file && cache) {
          return this.wikiRepository.delete(cache.id).pipe(map(() => undefined));
        }
        if (!file) {
          return of(undefined);
        }
        if (file.sha === cache?.sha) {
          return of(cache);
        }
        return this.requestClass(name, cache);
      })
    );
  }

  private requestClass(name: string, cache?: WikiClassDto): Observable<WikiClassDto | undefined> {
    return this.wikiClient.getClass(name).pipe(
      map((file: WikiFileDto) => this.wikiParser.parseClass(file, name)),
      switchMap((wikiClass: WikiClassDto) => {
        let operation$: Observable<number> = of(NaN);

        if (!cache) {
          operation$ = this.wikiRepository.create(wikiClass);
        } else if (wikiClass.sha !== cache.sha) {
          operation$ = this.wikiRepository.update(wikiClass);
        }
        return operation$.pipe(map(() => wikiClass));
      }),
      catchError(this.showError.bind(this))
    );
  }

  private findClass(name: string): Observable<WikiFileEntryDto | undefined> {
    return this.classes$.pipe(
      map((files: WikiFileEntryDto[]) => {
        return files.find((file) => file.className === name.toLowerCase());
      })
    );
  }

  private invalidateClasses(): OperatorFunction<WikiFileEntryDto[], WikiFileEntryDto[]> {
    return pipe(
      expand(() => timer(this.invalidationDelay).pipe(switchMap(() => this.wikiClient.getClasses()))),
      shareReplay(1)
    );
  }

  private showError(error: any, _caught: Observable<any>): Observable<any> {
    if (!(error instanceof GitHubRateLimitError)) {
      this.toast.open('Failed to get documentation from GitBook. Reason: unknown.');
      return of(undefined);
    }
    const now: Date = new Date();

    if (now <= this.nextErrorAt) {
      return of(undefined);
    }
    this.toast.open('Failed to get documentation from GitBook. Reason: api rate limit reached.');
    this.nextErrorAt.setTime(error.rateLimit.reset.getTime());
    return of(undefined);
  }

}
