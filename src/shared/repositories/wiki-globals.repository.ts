import {Injectable} from "@angular/core";
import {CrudRepository} from "./crud.repository";
import {WikiGlobalDto} from "../dtos/wiki.dto";
import {Table} from "dexie";
import {Observable} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {WikiDB} from "./wiki.database";

@Injectable({
  providedIn: 'root'
})
export class WikiGlobalsRepository extends CrudRepository<WikiGlobalDto> {

  constructor(db: WikiDB) {
    super(db);
  }

  protected override get table(): Table<WikiGlobalDto, number, WikiGlobalDto> {
    return this.db.globals;
  }

  public findByName(name: string): Observable<WikiGlobalDto | undefined> {
    return fromPromise(this.table.where('name').equalsIgnoreCase(name).first());
  }

}
