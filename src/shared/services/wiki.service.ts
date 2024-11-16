import {Injectable} from "@angular/core";
import {WikiClient} from "../clients/wiki.client";
import {WikiParser, WikiParserError, WikiParserErrorCode} from "../parsers/wiki.parser";
import {WikiClassDto, WikiFileDto, WikiFileEntryDto, WikiGlobalDto} from "../dtos/wiki.dto";
import {
  catchError,
  combineLatestWith,
  EMPTY,
  expand,
  map,
  Observable,
  of,
  OperatorFunction,
  pipe,
  shareReplay,
  switchMap,
  timer,
  zip
} from "rxjs";
import {MatSnackBar} from "@angular/material/snack-bar";
import {GitHubRateLimitError} from "../clients/github.client";
import {WikiClassesRepository} from "../repositories/wiki-classes.repository";
import {WikiGlobalsRepository} from "../repositories/wiki-globals.repository";

@Injectable({
  providedIn: 'root'
})
export class WikiService {

  private readonly classes$: Observable<WikiFileEntryDto[]>;
  private readonly globals$: Observable<WikiFileDto>;

  private readonly invalidationDelay: number = 10 * 60 * 1000;
  private readonly nextErrorAt: Date;

  constructor(private readonly classesRepository: WikiClassesRepository,
              private readonly globalsRepository: WikiGlobalsRepository,
              private readonly client: WikiClient,
              private readonly parser: WikiParser,
              private readonly toast: MatSnackBar) {
    this.classes$ = this.client.getClasses().pipe(this.invalidateClasses());
    this.globals$ = this.client.getGlobals().pipe(this.invalidateGlobals());
    this.nextErrorAt = new Date();
  }

  public getClass(name: string): Observable<WikiClassDto | undefined> {
    return this.findClass(name).pipe(
      combineLatestWith(this.classesRepository.findByName(name)),
      switchMap(([file, cache]: [WikiFileEntryDto | undefined, WikiClassDto | undefined]) => {
        if (!file && cache) {
          return this.classesRepository.delete(cache.id).pipe(map(() => undefined));
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

  public getGlobal(id: number): Observable<WikiGlobalDto | undefined> {
    return this.getGlobals().pipe(
      map((globals) => {
        return globals.find((global) => global.id === id);
      })
    );
  }

  public getGlobals(): Observable<WikiGlobalDto[]> {
    return this.globals$.pipe(
      map((file: WikiFileDto) => this.parser.parseGlobals(file)),
      combineLatestWith(this.globalsRepository.findAll()),
      switchMap(([globals, caches]: [WikiGlobalDto[], WikiGlobalDto[]]) => {
        const operations$: Observable<WikiGlobalDto | undefined>[] = [];

        for (const cache of caches) {
          const global: WikiGlobalDto | undefined = globals.find((item) => item.name === cache.name);

          if (!global) {
            operations$.push(this.globalsRepository.delete(cache.id).pipe(map(() => undefined)));
          }
        }
        for (const global of globals) {
          const cache: WikiGlobalDto | undefined = caches.find((item) => item.name === global.name);

          operations$.push(this.requestGlobal(global, cache));
        }
        return zip(operations$);
      }),
      map((globals: (WikiGlobalDto | undefined)[]) => {
        return globals.filter((wikiGlobal) => !!wikiGlobal) as WikiGlobalDto[];
      }),
      catchError(this.showError.bind(this)),
      map((globals?: WikiGlobalDto[]) => globals ?? [])
    );
  }

  private requestClass(name: string, cache?: WikiClassDto): Observable<WikiClassDto | undefined> {
    return this.client.getClass(name).pipe(
      map((file: WikiFileDto) => this.parser.parseClass(file, name)),
      switchMap((wikiClass: WikiClassDto) => {
        let operation$: Observable<number> = of(NaN);

        if (!cache) {
          operation$ = this.classesRepository.create(wikiClass);
        } else if (wikiClass.sha !== cache.sha) {
          operation$ = this.classesRepository.update(wikiClass);
        }
        return operation$.pipe(map(() => wikiClass));
      }),
      catchError(this.showError.bind(this))
    );
  }

  private requestGlobal(global: WikiGlobalDto, cache?: WikiGlobalDto): Observable<WikiGlobalDto | undefined> {
    let operation$: Observable<WikiGlobalDto> = EMPTY;

    if (global.sha === cache?.sha) {
      operation$ = of(cache);
    } else if (!cache) {
      operation$ = this.globalsRepository.create(global).pipe(map(() => global));
    } else if (global.sha !== cache.sha) {
      operation$ = this.globalsRepository.update(global).pipe(map(() => global));
    }
    return operation$;
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
      expand(() => timer(this.invalidationDelay).pipe(switchMap(() => this.client.getClasses()))),
      shareReplay(1)
    );
  }

  private invalidateGlobals(): OperatorFunction<WikiFileDto, WikiFileDto> {
    return pipe(
      expand(() => timer(this.invalidationDelay).pipe(switchMap(() => this.client.getGlobals()))),
      shareReplay(1)
    );
  }

  private showError(error: any, _caught: Observable<any>): Observable<any> {
    if (error instanceof GitHubRateLimitError) {
      return this.showRateLimitError(error);
    } else if (error instanceof WikiParserError && error.code === WikiParserErrorCode.noTitle) {
      return this.showNoTitleError(error);
    } else if (error instanceof WikiParserError && error.code === WikiParserErrorCode.noContent) {
      return this.showNoContentError(error);
    } else {
      this.toast.open('Failed to get documentation from GitBook. Reason: unknown.');
      return of(undefined);
    }
  }

  private showRateLimitError(error: GitHubRateLimitError): Observable<any> {
    const now: Date = new Date();

    if (now <= this.nextErrorAt) {
      return of(undefined);
    }
    this.toast.open('Failed to get documentation from GitBook. Reason: api rate limit reached.');
    this.nextErrorAt.setTime(error.rateLimit.reset.getTime());
    return of(undefined);
  }

  private showNoTitleError(error: WikiParserError): Observable<any> {
    this.toast.open(`Failed to parse documentation. Reason: no title found for \`${error.className}\`.`);
    return of(undefined);
  }

  private showNoContentError(error: WikiParserError): Observable<any> {
    this.toast.open(
      `Failed to parse documentation. Reason: no description nor functions found for \`${error.className}\`.`
    );
    return of(undefined);
  }

}
