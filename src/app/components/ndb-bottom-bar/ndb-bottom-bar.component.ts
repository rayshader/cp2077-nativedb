import {Component} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatToolbarModule} from "@angular/material/toolbar";
import {NDBIdeThemeComponent} from "../ndb-ide-theme/ndb-ide-theme.component";
import {NDBThemeModeComponent} from "../ndb-theme-mode/ndb-theme-mode.component";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'ndb-bottom-bar',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    NDBThemeModeComponent,
    NDBIdeThemeComponent
  ],
  templateUrl: './ndb-bottom-bar.component.html',
  styleUrl: './ndb-bottom-bar.component.scss'
})
export class NDBBottomBarComponent {

}
