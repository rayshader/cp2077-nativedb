import {Injectable} from "@angular/core";
import {MatIconRegistry} from "@angular/material/icon";
import {DomSanitizer} from "@angular/platform-browser";

@Injectable({
  providedIn: 'root'
})
export class IconsService {
  private readonly icons: string[] = [
    // UI
    'delete-empty', 'pin', 'pin-off', 'code-syntax', 'github', 'gitbook', 'bookshelf', 'discord',
    'sort-alpha', 'sort-numeric',

    // Nodes
    'enum', 'bitfield', 'class', 'struct', 'function',

    // Visibility
    'scope',

    // Flags
    'abstract', 'callback', 'const', 'final', 'importonly', 'native', 'quest', 'replicated', 'static', 'timer'
  ];

  constructor(private readonly iconRegistry: MatIconRegistry,
              private readonly sanitizer: DomSanitizer) {
  }

  load(): void {
    for (const icon of this.icons) {
      this.iconRegistry.addSvgIcon(
        icon,
        this.sanitizer.bypassSecurityTrustResourceUrl(`./assets/icons/${icon}.svg`)
      );
    }
  }
}
