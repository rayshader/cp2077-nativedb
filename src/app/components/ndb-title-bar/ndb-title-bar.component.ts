import {Component, HostBinding, Input} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";

@Component({
  selector: 'ndb-title-bar',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './ndb-title-bar.component.html',
  styleUrl: './ndb-title-bar.component.scss'
})
export class NDBTitleBarComponent {

  @Input()
  title: string = '';

  @Input()
  hidden: boolean = false;

  isPinned: boolean = true;

  @HostBinding('class.pin')
  get classPin(): boolean {
    return this.isPinned;
  }

  togglePin(): void {
    this.isPinned = !this.isPinned;
  }

}
