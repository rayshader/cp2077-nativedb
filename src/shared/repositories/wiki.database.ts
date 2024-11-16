import Dexie, {Table} from "dexie";
import {WikiClassDto, WikiGlobalDto} from "../dtos/wiki.dto";

export interface Entity {
  id?: number;
}

export class WikiDB extends Dexie {

  classes!: Table<WikiClassDto, number>;
  globals!: Table<WikiGlobalDto, number>;

  constructor() {
    super('ndb-wiki');
    this.version(1).stores({
      classes: '&id, &name'
    });
    this.version(2).stores({
      classes: '&id, &name',
      globals: '&id, &name'
    });
  }

}
