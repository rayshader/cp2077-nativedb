import {Component, DestroyRef, OnInit} from '@angular/core';
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {debounceTime} from "rxjs";
import {SearchService} from "../../../shared/services/search.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ndb-search',
  standalone: true,
  imports: [
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './ndb-search.component.html',
  styleUrl: './ndb-search.component.scss'
})
export class NDBSearchComponent implements OnInit {

  query: FormControl<string | null> = new FormControl('');

  constructor(private readonly searchService: SearchService,
              private readonly dr: DestroyRef) {
  }

  ngOnInit(): void {
    this.query.valueChanges
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.dr)
      )
      .subscribe((query) => {
        query ??= '';
        query = query.trim();
        this.searchService.search(query);
      });
  }

}
