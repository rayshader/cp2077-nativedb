import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {ClassRepository} from "./class.repository";

@Injectable({
  providedIn: 'root'
})
export class DocumentationDatabase {

  private static readonly dbVersion: number = 1;

  private db?: IDBDatabase;

  init(): Observable<void> {
    return new Observable<void>((observer) => {
      const request: IDBOpenDBRequest = indexedDB.open('documentation', DocumentationDatabase.dbVersion);

      request.onerror = (event) => {
        observer.error();
        observer.complete();
      };
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        // @ts-ignore
        const db: IDBDatabase = event.target.result;

        ClassRepository.upgrade(db, event.oldVersion, event.newVersion);
      };
      request.onsuccess = (event) => {
        // @ts-ignore
        this.db = event.target.result;
        observer.next();
        observer.complete();
      };
    });
  }

  read(name: string): IDBObjectStore {
    return this.db!.transaction(name, 'readonly').objectStore(name);
  }

  write(name: string): IDBObjectStore {
    return this.db!.transaction(name, 'readwrite').objectStore(name);
  }

}
