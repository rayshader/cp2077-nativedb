import {Injectable} from "@angular/core";
import {CrudRepository} from "./crud.repository";
import {WikiClassDto} from "../dtos/wiki.dto";
import {Table} from "dexie";
import {Observable} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {WikiDB} from "./wiki.database";

@Injectable({
  providedIn: 'root'
})
export class WikiClassesRepository extends CrudRepository<WikiClassDto> {

  constructor(db: WikiDB) {
    super(db);
  }

  protected override get table(): Table<WikiClassDto, number, WikiClassDto> {
    return this.db.classes;
  }

  public findByName(name: string): Observable<WikiClassDto | undefined> {
    return fromPromise(this.table.where('name').equalsIgnoreCase(name).first());
  }

}
