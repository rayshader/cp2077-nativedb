import {DocumentationDatabase} from "./documentation.database";
import {Observable} from "rxjs";

export interface Entity {
  readonly id: number;
}

export abstract class CrudRepository<T extends Entity> {

  protected constructor(protected readonly db: DocumentationDatabase,
                        private readonly store: string) {
  }

  findAll(): Observable<T[]> {
    return new Observable((observer) => {
      const store: IDBObjectStore = this.read();
      const request: IDBRequest = store.getAll();

      request.onerror = (event) => {
        observer.error();
        observer.complete();
      };
      request.onsuccess = (event) => {
        // @ts-ignore
        const entities: T[] = event.target.result;

        observer.next(entities);
        observer.complete();
      };
    });
  }

  findById(id: number): Observable<T | undefined> {
    return new Observable((observer) => {
      const store: IDBObjectStore = this.read();
      const request: IDBRequest = store.get(id);

      request.onerror = (event) => {
        observer.error();
        observer.complete();
      };
      request.onsuccess = (event) => {
        // @ts-ignore
        const entity: T | undefined = event.target.result;

        observer.next(entity);
        observer.complete();
      };
    });
  }

  create(entity: T): Observable<void> {
    return new Observable((observer) => {
      const store: IDBObjectStore = this.write();
      const request: IDBRequest = store.add(entity);

      request.onerror = (event) => {
        observer.error();
        observer.complete();
      };
      request.onsuccess = (event) => {
        observer.next();
        observer.complete();
      };
    });
  }

  update(entity: T): Observable<void> {
    return new Observable((observer) => {
      const store: IDBObjectStore = this.write();
      const request: IDBRequest = store.put(entity);

      request.onerror = (event) => {
        observer.error();
        observer.complete();
      };
      request.onsuccess = (event) => {
        observer.next();
        observer.complete();
      };
    });
  }

  delete(id: number): Observable<void> {
    return new Observable((observer) => {
      const store: IDBObjectStore = this.write();
      const request: IDBRequest = store.delete(id);

      request.onerror = (event) => {
        observer.error();
        observer.complete();
      };
      request.onsuccess = (event) => {
        observer.next();
        observer.complete();
      };
    });
  }

  protected read(): IDBObjectStore {
    return this.db.read(this.store);
  }

  protected write(): IDBObjectStore {
    return this.db.write(this.store);
  }

}
