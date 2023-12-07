import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
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
import {Subscription} from "rxjs";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";

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
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('page')
  page?: ElementRef;

  private scrollS?: Subscription;

  constructor(private readonly iconsService: IconsService,
              private readonly pageService: PageService) {
  }

  ngOnInit(): void {
    this.iconsService.load();
    this.scrollS = this.pageService.scroll$.subscribe(this.scroll.bind(this));
  }

  ngOnDestroy(): void {
    this.scrollS?.unsubscribe();
  }

  private scroll(): void {
    this.page?.nativeElement.scrollTo({top: 0, behavior: 'smooth'});
  }

}
