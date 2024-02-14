import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {ClassDocumentation, DocumentationService} from "../../../shared/services/documentation.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {DocumentationParser} from "../../../shared/parsers/documentation.parser";
import {MatMenuModule} from "@angular/material/menu";
import {Router, RouterLink} from "@angular/router";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {NDBCommand, NDBCommandHandler, NDBMessage, NDBWorker} from "../../../shared/worker.common";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'ndb-sync-documentation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ndb-sync-documentation.component.html',
  styleUrl: './ndb-sync-documentation.component.scss'
})
export class NDBSyncDocumentationComponent implements OnInit, OnDestroy {

  @ViewChild('download')
  input?: ElementRef;

  @ViewChild('upload')
  link?: ElementRef;

  isReady: false | 'sync' | 'async' = false;
  isLoading: boolean = false;

  private worker?: NDBWorker;
  private readonly commands: NDBCommandHandler[] = [
    {command: NDBCommand.ready, fn: this.onWorkerReady.bind(this)},
    {command: NDBCommand.export, fn: this.onWorkerExport.bind(this)},
    {command: NDBCommand.import, fn: this.onWorkerImport.bind(this)},

    {command: NDBCommand.importError, fn: this.onWorkerImportFailed.bind(this)},
    {command: NDBCommand.exportError, fn: this.onWorkerExportFailed.bind(this)},
  ];

  constructor(private readonly documentationService: DocumentationService,
              private readonly documentationParser: DocumentationParser,
              private readonly toast: MatSnackBar,
              private readonly router: Router,
              private readonly ngZone: NgZone,
              private readonly cdr: ChangeDetectorRef,
              private readonly dr: DestroyRef) {
  }

  private get $input(): HTMLInputElement {
    return this.input?.nativeElement;
  }

  private get $link(): HTMLAnchorElement {
    return this.link?.nativeElement;
  }

  async ngOnInit(): Promise<void> {
    await this.loadWorker();
  }

  ngOnDestroy() {
    this.worker?.terminate();
  }

  import(): void {
    this.$input.click();
  }

  export(): void {
    this.documentationService.getAll().pipe(takeUntilDestroyed(this.dr)).subscribe(this.onExport.bind(this));
  }

  async onImport(): Promise<void> {
    if (!this.$input.files) {
      return;
    }
    if (this.$input.files.length !== 1) {
      return;
    }
    this.isLoading = true;
    this.cdr.markForCheck();
    const file: File = this.$input.files[0];
    const buffer: Uint8Array = new Uint8Array(await file.arrayBuffer());

    if (this.isReady === 'sync') {
      try {
        const data: ClassDocumentation[] = this.documentationParser.read(buffer);

        this.onWorkerImport(data);
      } catch (error) {
        this.onWorkerImportFailed(error);
      }
      return;
    }
    this.worker!.postMessage(<NDBMessage>{
      command: NDBCommand.import,
      data: buffer
    });
  }

  private onExport(data: ClassDocumentation[]): void {
    this.isLoading = true;
    if (this.isReady === 'sync') {
      try {
        const file: Blob = this.documentationParser.write(data);

        this.onWorkerExport(file);
      } catch (error) {
        this.onWorkerExportFailed(error);
      }
      return;
    }
    this.worker!.postMessage(<NDBMessage>{
      command: NDBCommand.export,
      data: data,
    });
  }

  private async loadWorker(): Promise<void> {
    if (!NDBWorker.isCompatible()) {
      // Fallback to blocking import/export operations.
      await this.documentationParser.load();
      this.isReady = 'sync';
      this.cdr.markForCheck();
      console.info('WebWorker not supported, falling back to blocking operations.');
      return;
    }
    let instance: Worker | SharedWorker;

    if (typeof SharedWorker !== 'undefined') {
      instance = new SharedWorker(new URL('./ndb-sync-documentation.worker', import.meta.url));
    } else {
      instance = new Worker(new URL('./ndb-sync-documentation.worker', import.meta.url));
    }
    this.worker = new NDBWorker(instance, this.ngZone);
    this.worker.onmessage = this.onMessage.bind(this);
  }

  private onMessage(event: MessageEvent): void {
    const message: NDBMessage = event.data as NDBMessage;
    const handler: NDBCommandHandler | undefined = this.commands.find((item) => item.command === message.command);

    if (!handler) {
      console.warn('MainWorker: unknown command.');
      return;
    }
    handler.fn(message.data);
  }

  private onWorkerReady(): void {
    this.isReady = 'async';
    this.cdr.markForCheck();
  }

  private onWorkerExport(file: Blob): void {
    const url: string = URL.createObjectURL(file);

    this.$link.href = url;
    this.$link.download = 'cp2077_documentation.json.br';
    this.$link.click();
    URL.revokeObjectURL(url);
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private onWorkerImport(data: ClassDocumentation[]): void {
    this.isLoading = false;
    this.cdr.markForCheck();
    this.router.navigate(['import'], {state: data, skipLocationChange: true});
  }

  private onWorkerExportFailed(error: any): void {
    let message: string = 'Failed to export your documentation. Please report this issue.';

    this.toast.open(message, undefined, {duration: 3000});
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private onWorkerImportFailed(error: any): void {
    let message: string = 'Failed to import this file. Please report this issue with your file in attachment.';

    if (typeof error === 'string' && error.includes('kind: UnexpectedEof')) {
      message = 'Failed to import this file. Unable to decompress with Brotli.';
    } else if (error instanceof SyntaxError) {
      message = 'Failed to import this file. Unable to read JSON data.';
    }
    this.toast.open(message, undefined, {duration: 3000});
    this.isLoading = false;
    this.cdr.markForCheck();
  }
}
