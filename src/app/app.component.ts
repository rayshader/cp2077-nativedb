import {Component, DestroyRef, ElementRef, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from "@angular/material/toolbar";
import {RedAstTabsComponent} from "./components/red-ast-tabs/red-ast-tabs.component";
import {IconsService} from "../shared/services/icons.service";
import {HttpClientModule} from "@angular/common/http";
import {RdSearchComponent} from "./components/rd-search/rd-search.component";
import {RdThemeModeComponent} from "./components/rd-theme-mode/rd-theme-mode.component";
import {MatChipsModule} from "@angular/material/chips";
import {PageService} from "../shared/services/page.service";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    HttpClientModule,
    MatToolbarModule,
    MatChipsModule,
    RedAstTabsComponent,
    RdSearchComponent,
    RdThemeModeComponent,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild('page')
  page?: ElementRef;

  constructor(private readonly iconsService: IconsService,
              private readonly pageService: PageService,
              private readonly dr: DestroyRef) {
  }

  ngOnInit(): void {
    this.iconsService.load();
    this.pageService.scroll$.pipe(takeUntilDestroyed(this.dr)).subscribe(this.scroll.bind(this));
  }

  private scroll(): void {
    this.page?.nativeElement.scrollTo({top: 0, behavior: 'smooth'});
  }

}
