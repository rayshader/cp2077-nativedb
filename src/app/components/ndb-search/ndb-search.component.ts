import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, output} from '@angular/core';
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {debounceTime} from "rxjs";
import {FilterBy, SearchService} from "../../../shared/services/search.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {MatButtonModule} from "@angular/material/button";
import {MatMenuModule} from "@angular/material/menu";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatBadgeModule} from "@angular/material/badge";
import {MatCheckbox} from "@angular/material/checkbox";

interface FilterItem {
  value: FilterBy;
  name: string;
}

@Component({
  selector: 'ndb-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCheckbox,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    ReactiveFormsModule
  ],
  templateUrl: './ndb-search.component.html',
  styleUrl: './ndb-search.component.scss'
})
export class NDBSearchComponent implements OnInit {

  private readonly searchService: SearchService = inject(SearchService);
  private readonly dr: DestroyRef = inject(DestroyRef);

  readonly search = output<void>();

  readonly query: FormControl<string | null> = new FormControl('');
  readonly strict: FormControl<boolean | null> = new FormControl(false);

  strictMode: boolean = false;
  filter: FilterBy = FilterBy.name;
  filterBadgeLabel?: string;

  readonly filters: FilterItem[] = [
    {value: FilterBy.name, name: 'Name'},
    {value: FilterBy.property, name: 'Property'},
    {value: FilterBy.function, name: 'Function'},
    {value: FilterBy.usage, name: 'Usage'},
  ];

  ngOnInit(): void {
    this.strict.valueChanges.pipe(takeUntilDestroyed(this.dr)).subscribe(this.onStrictChanged.bind(this));
    this.searchService.changeQuery$.pipe(
      takeUntilDestroyed(this.dr)
    ).subscribe((request) => {
      const query: string = this.query.value ?? '';

      if (query === request.query) {
        return;
      }
      this.updateFilter(request.filter);
      this.query.setValue(request.query);
      this.strict.setValue(request.strict);
    });
    this.query.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.dr)
    ).subscribe((query) => {
      query ??= '';
      query = query.trim();
      this.searchService.search(query, this.filter, this.strictMode);
      if (query.length > 0) {
        this.search.emit();
      }
    });
  }

  clear(): void {
    this.query.setValue('');
  }

  onFilterChanged(filter: FilterItem): void {
    if (filter.value === this.filter) {
      return;
    }
    this.updateFilter(filter.value);
    let query: string = this.query.value ?? '';

    query = query.trim();
    if (query.length === 0) {
      return;
    }
    this.query.setValue(query);
  }

  onStrictChanged(isStrict: boolean | null): void {
    this.strictMode = isStrict === true;
    this.query.setValue(this.query.value);
  }

  private updateFilter(filter: FilterBy): void {
    this.filter = filter;
    if (this.filter === FilterBy.name) {
      this.filterBadgeLabel = undefined;
    } else {
      this.filterBadgeLabel = FilterBy[this.filter][0].toUpperCase();
    }
  }

}
