import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MatToolbarModule} from "@angular/material/toolbar";
import {RedAstTabsComponent} from "./components/red-ast-tabs/red-ast-tabs.component";
import {IconsService} from "../shared/services/icons.service";
import {HttpClientModule} from "@angular/common/http";
import {RdSearchComponent} from "./components/rd-search/rd-search.component";
import {RdThemeModeComponent} from "./components/rd-theme-mode/rd-theme-mode.component";

@Component({
  selector: 'app',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    HttpClientModule,
    MatToolbarModule,
    RedAstTabsComponent,
    RdSearchComponent,
    RdThemeModeComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  constructor(private readonly iconsService: IconsService) {
  }

  ngOnInit(): void {
    this.iconsService.load();
  }

}
