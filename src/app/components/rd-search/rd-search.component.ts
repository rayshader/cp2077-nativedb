import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {debounceTime, Subscription} from "rxjs";
import {SearchService} from "../../../shared/services/search-service";

@Component({
  selector: 'rd-search',
  standalone: true,
  imports: [
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './rd-search.component.html',
  styleUrl: './rd-search.component.scss'
})
export class RdSearchComponent implements OnInit, OnDestroy {

  query: FormControl<string | null> = new FormControl('');

  private queryS?: Subscription;

  constructor(private readonly searchService: SearchService) {
  }

  ngOnInit(): void {
    this.queryS = this.query.valueChanges
      .pipe(debounceTime(300))
      .subscribe((query) => {
        query ??= '';
        query = query.trim();
        this.searchService.search(query);
      });
  }

  ngOnDestroy(): void {
    this.queryS?.unsubscribe();
  }

}
