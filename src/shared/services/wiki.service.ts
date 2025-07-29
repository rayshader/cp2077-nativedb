import {inject, Injectable, signal} from "@angular/core";
import {WikiClient} from "../clients/wiki.client";
import {WikiParser, WikiParserError, WikiParserErrorCode} from "../parsers/wiki.parser";
import {WikiClassDto, WikiFileDto, WikiFileEntryDto, WikiGlobalDto} from "../dtos/wiki.dto";
import {MatSnackBar} from "@angular/material/snack-bar";
import {GitHubRateLimitError} from "../clients/github.client";
import {WikiClassesRepository} from "../repositories/wiki-classes.repository";
import {WikiGlobalsRepository} from "../repositories/wiki-globals.repository";
import {firstValueFrom} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WikiService {

  private readonly classesRepository = inject(WikiClassesRepository);
  private readonly globalsRepository = inject(WikiGlobalsRepository);
  private readonly client = inject(WikiClient);
  private readonly parser = inject(WikiParser);
  private readonly toast = inject(MatSnackBar);

  private readonly classes = signal<WikiFileEntryDto[]>([]);
  private readonly globals = signal<WikiFileDto | null>(null);
  private readonly isLoading = signal<boolean>(false);
  private readonly updatedAt = signal<Date>(new Date());

  private readonly invalidationDelay: number = 60 * 60 * 1000;
  private readonly nextErrorAt: Date = new Date();

  constructor() {
    setInterval(() => this.load(), this.invalidationDelay);
  }

  public async load(): Promise<void> {
    try {
      await Promise.all([
        this.loadClasses(),
        this.loadGlobals()
      ]);
    } catch (error) {
      this.handleError(error);
    }
  }

  public async getClass(name: string): Promise<WikiClassDto | undefined> {
    await this.ensureClassesLoaded();

    const files = this.classes();
    const file = files.find((file) => file.className === name.toLowerCase());

    try {
      const cache = await firstValueFrom(this.classesRepository.findByName(name));

      if (!file && cache) {
        await firstValueFrom(this.classesRepository.delete(cache.id));
        return undefined;
      }

      if (!file) {
        return undefined;
      }

      if (file.sha === cache?.sha) {
        return cache;
      }

      return await this.requestClass(name, cache);
    } catch (error) {
      this.handleError(error);
      return undefined;
    }
  }

  public async getGlobal(id: number): Promise<WikiGlobalDto | undefined> {
    const globals = await this.getGlobals();
    return globals.find((global) => global.id === id);
  }

  public async getGlobals(): Promise<WikiGlobalDto[]> {
    await this.ensureGlobalsLoaded();

    const files = this.globals();
    if (!files) {
      return [];
    }

    try {
      const globals = this.parser.parseGlobals(files);
      const caches = await firstValueFrom(this.globalsRepository.findAll());
      const operations: Promise<WikiGlobalDto | undefined | void>[] = [];

      // Handle deleted globals
      for (const cache of caches) {
        const global = globals.find((item) => item.name === cache.name);
        if (!global) {
          operations.push(firstValueFrom(this.globalsRepository.delete(cache.id)));
        }
      }

      // Handle new or updated globals
      for (const global of globals) {
        const cache = caches.find((item) => item.name === global.name);
        operations.push(this.requestGlobal(global, cache));
      }

      const results = await Promise.all(operations);
      return results.filter((global): global is WikiGlobalDto => !!global);
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  private async requestClass(name: string, cache?: WikiClassDto): Promise<WikiClassDto | undefined> {
    try {
      const file = await firstValueFrom(this.client.getClass(name));
      const wikiClass = this.parser.parseClass(file, name);

      if (!cache) {
        await firstValueFrom(this.classesRepository.create(wikiClass));
      } else if (wikiClass.sha !== cache.sha) {
        await firstValueFrom(this.classesRepository.update(wikiClass));
      }

      return wikiClass;
    } catch (error) {
      this.handleError(error);
      return undefined;
    }
  }

  private async requestGlobal(global: WikiGlobalDto, cache?: WikiGlobalDto): Promise<WikiGlobalDto | undefined> {
    try {
      if (global.sha === cache?.sha) {
        return cache;
      } else if (!cache) {
        await this.globalsRepository.create(global);
        return global;
      } else if (global.sha !== cache.sha) {
        await this.globalsRepository.update(global);
        return global;
      }
      return global;
    } catch (error) {
      this.handleError(error);
      return undefined;
    }
  }

  private async ensureClassesLoaded(): Promise<void> {
    if (this.classes().length === 0 || this.shouldRefreshClasses()) {
      await this.loadClasses();
    }
  }

  private async ensureGlobalsLoaded(): Promise<void> {
    if (!this.globals() || this.shouldRefreshGlobals()) {
      await this.loadGlobals();
    }
  }

  private shouldRefreshClasses(): boolean {
    const now = new Date();
    return now.getTime() - this.updatedAt().getTime() > this.invalidationDelay;
  }

  private shouldRefreshGlobals(): boolean {
    const now = new Date();
    return now.getTime() - this.updatedAt().getTime() > this.invalidationDelay;
  }

  private async loadClasses(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    try {
      const classes = await firstValueFrom(this.client.getClasses());
      this.classes.set(classes);
      this.updatedAt.set(new Date());
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadGlobals(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    try {
      const globals = await firstValueFrom(this.client.getGlobals());
      this.globals.set(globals);
      this.updatedAt.set(new Date());

      setTimeout(() => this.loadGlobals(), this.invalidationDelay);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleError(error: any): void {
    if (error.name === 'ConstraintError') {
      // NOTE: silence mutation error on first loading.
      return;
    }
    if (error instanceof GitHubRateLimitError) {
      this.showRateLimitError(error);
    } else if (error instanceof WikiParserError && error.code === WikiParserErrorCode.noTitle) {
      this.showNoTitleError(error);
    } else if (error instanceof WikiParserError && error.code === WikiParserErrorCode.noContent) {
      this.showNoContentError(error);
    } else {
      this.toast.open('Failed to get documentation from GitBook. Reason: unknown.');
    }
  }

  private showRateLimitError(error: GitHubRateLimitError): void {
    const now = new Date();

    if (now <= this.nextErrorAt) {
      return;
    }
    this.toast.open('Failed to get documentation from GitBook. Reason: api rate limit reached.');
    this.nextErrorAt.setTime(error.rateLimit.reset.getTime());
  }

  private showNoTitleError(error: WikiParserError): void {
    this.toast.open(`Failed to parse documentation. Reason: no title found for \`${error.className}\`.`);
  }

  private showNoContentError(error: WikiParserError): void {
    this.toast.open(
      `Failed to parse documentation. Reason: no description nor functions found for \`${error.className}\`.`
    );
  }
}
