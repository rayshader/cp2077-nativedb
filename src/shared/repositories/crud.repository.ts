import {Table} from "dexie";
import {EMPTY, Observable} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {Entity, WikiDB} from "./wiki.database";

export abstract class CrudRepository<T extends Entity> {

  protected constructor(protected readonly db: WikiDB) {
  }

  protected abstract get table(): Table<T, number>;

  public findAll(): Observable<T[]> {
    return fromPromise(this.table.toArray());
  }

  public findById(id: number): Observable<T | undefined> {
    return fromPromise(this.table.get(id));
  }

  public create(entity: T): Observable<number> {
    return fromPromise(this.table.add(entity));
  }

  public update(entity: T): Observable<number> {
    if (entity.id === undefined) {
      return EMPTY;
    }
    return fromPromise(this.table.put(entity));
  }

  public delete(id: number): Observable<void> {
    return fromPromise(this.table.delete(id));
  }

}
