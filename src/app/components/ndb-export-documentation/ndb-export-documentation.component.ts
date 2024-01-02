import {Component, DestroyRef, ElementRef, OnInit, ViewChild} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {ClassDocumentation, DocumentationService} from "../../../shared/services/documentation.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {DocumentationParser} from "../../../shared/parsers/documentation.parser";
import {MatMenuModule} from "@angular/material/menu";
import {RouterLink} from "@angular/router";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {NDBCommand, NDBCommandHandler, NDBMessage} from "../../../shared/worker.common";

@Component({
  selector: 'ndb-export-documentation',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ndb-export-documentation.component.html',
  styleUrl: './ndb-export-documentation.component.scss'
})
export class NDBExportDocumentationComponent implements OnInit {

  @ViewChild('upload')
  link?: ElementRef;

  isReady: false | 'sync' | 'async' = false;
  isLoading: boolean = false;

  private worker?: Worker;
  private readonly commands: NDBCommandHandler[] = [
    {command: NDBCommand.ready, fn: this.onWorkerReady.bind(this)},
    {command: NDBCommand.export, fn: this.onWorkerExport.bind(this)},
  ];

  constructor(private readonly documentationService: DocumentationService,
              private readonly documentationParser: DocumentationParser,
              private readonly dr: DestroyRef) {
  }

  private get $link(): HTMLAnchorElement {
    return this.link?.nativeElement;
  }

  async ngOnInit(): Promise<void> {
    await this.loadWorker();
  }

  export(): void {
    this.documentationService.getAll().pipe(takeUntilDestroyed(this.dr)).subscribe(this.onExport.bind(this));
  }

  private onExport(data: ClassDocumentation[]): void {
    this.isLoading = true;
    if (this.isReady === 'sync') {
      const file: Blob = this.documentationParser.write(data);

      this.onWorkerExport(file);
      return;
    }
    this.worker!.postMessage(<NDBMessage>{
      command: NDBCommand.export,
      data: data,
    });
  }

  private async loadWorker(): Promise<void> {
    if (typeof Worker === 'undefined') {
      // Fallback to blocking import/export operations.
      await this.documentationParser.load();
      this.isReady = 'sync';
      console.info('WebWorker not supported, falling back to blocking operations.');
      return;
    }
    this.worker = new Worker(new URL('./ndb-export-documentation.worker', import.meta.url));
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
  }

  private onWorkerExport(file: Blob): void {
    const url: string = URL.createObjectURL(file);

    this.$link.href = url;
    this.$link.download = 'cp2077_documentation.json.br';
    this.$link.click();
    URL.revokeObjectURL(url);
    this.isLoading = false;
  }
}
