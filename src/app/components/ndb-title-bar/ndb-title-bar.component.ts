import {Component, HostBinding, Input} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {SettingsService} from "../../../shared/services/settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {take} from "rxjs";

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

  constructor(private readonly settingsService: SettingsService) {
    this.settingsService.isBarPinned$.pipe(take(1), takeUntilDestroyed()).subscribe(this.onSettingsLoaded.bind(this));
  }

  @HostBinding('class.pin')
  get classPin(): boolean {
    return this.isPinned;
  }

  togglePin(): void {
    this.isPinned = !this.isPinned;
    this.settingsService.updateIsBarPinned(this.isPinned);
  }

  private onSettingsLoaded(state: boolean): void {
    this.isPinned = state;
  }

}
