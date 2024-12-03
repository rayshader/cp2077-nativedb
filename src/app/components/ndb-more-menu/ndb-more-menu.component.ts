import {Component} from '@angular/core';
import {MatIconButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MatMenu, MatMenuItem, MatMenuTrigger} from "@angular/material/menu";
import {RouterLink} from "@angular/router";
import {MatTooltip} from "@angular/material/tooltip";
import {MatDivider} from "@angular/material/divider";

@Component({
  selector: 'ndb-more-menu',
  imports: [
    RouterLink,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatDivider,
    MatTooltip
  ],
  templateUrl: './ndb-more-menu.component.html',
  styleUrl: './ndb-more-menu.component.scss'
})
export class NDBMoreMenuComponent {

  openGitHub(): void {
    window.open('https://github.com/rayshader/cp2077-nativedb', '_blank');
  }

  openGitBook(): void {
    window.open('https://wiki.redmodding.org/nativedb-documentation', '_blank');
  }

  openWiki(): void {
    window.open('https://wiki.redmodding.org', '_blank');
  }

  openDiscord(): void {
    window.open('https://discord.gg/redmodding', '_blank');
  }

}
