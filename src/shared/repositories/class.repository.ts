import {Injectable} from "@angular/core";
import {DocumentationDatabase} from "./documentation.database";
import {CrudRepository} from "./crud.repository";
import {ClassDocumentation} from "../services/documentation.service";

@Injectable({
  providedIn: 'root'
})
export class ClassRepository extends CrudRepository<ClassDocumentation> {

  constructor(db: DocumentationDatabase) {
    super(db, 'classes');
  }

  static upgrade(db: IDBDatabase, oldVersion: number, newVersion: number | null): void {
    db.createObjectStore('classes', {keyPath: 'id'});
  }

}
