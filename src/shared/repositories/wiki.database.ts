import Dexie, {Table} from "dexie";
import {WikiClassDto} from "../dtos/wiki.dto";

export interface Entity {
  id?: number;
}

export class WikiDB extends Dexie {

  classes!: Table<WikiClassDto, number>;

  constructor() {
    super('ndb-wiki');
    this.version(1).stores({
      classes: '&id, &name'
    });
  }

}
