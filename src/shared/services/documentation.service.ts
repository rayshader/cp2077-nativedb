import {Injectable} from "@angular/core";
import {Entity} from "../repositories/crud.repository";
import {ClassRepository} from "../repositories/class.repository";
import {map, mergeAll, Observable, switchMap, zip, zipAll} from "rxjs";

export interface ClassDocumentation extends Entity {
  body?: string;
  functions?: MemberDocumentation[];
}

export interface MemberDocumentation {
  readonly id: number;

  body: string;
}

export enum MergeOperation {
  none,
  add,
  update,
  delete
}

export enum MergeFrom {
  browser,
  file
}

export interface ClassMergeOperation {
  readonly id: number;
  readonly operation: MergeOperation;
  readonly body?: BodyMergeOperation;
  readonly members?: MemberMergeOperation[];
}

export interface BodyMergeOperation {
  readonly id: number;
  readonly operation: MergeOperation;
  readonly browser?: string;
  readonly file?: string;

  from?: MergeFrom;
}

export interface MemberMergeOperation {
  readonly id: number;
  readonly operation: MergeOperation;
  readonly browser?: string;
  readonly file?: string;

  from?: MergeFrom;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {

  constructor(private readonly classRepository: ClassRepository) {
  }

  getAll(): Observable<ClassDocumentation[]> {
    return this.classRepository.findAll();
  }

  getClassById(id: number): Observable<ClassDocumentation> {
    return this.classRepository.findById(id).pipe(
      map((documentation: ClassDocumentation | undefined) => {
        if (!documentation) {
          documentation = {id: id};
        }
        return documentation;
      })
    );
  }

  addFunction(documentation: ClassDocumentation, member: MemberDocumentation): Observable<void> {
    documentation.functions ??= [];
    documentation.functions.push(member);
    return this.classRepository.findById(documentation.id).pipe(
      switchMap((entity: ClassDocumentation | undefined) => {
        if (!entity) {
          return this.classRepository.create(documentation);
        }
        return this.classRepository.update(documentation);
      })
    );
  }

  deleteFunction(documentation: ClassDocumentation, id: number): Observable<void> {
    documentation.functions ??= [];
    const index: number = documentation.functions.findIndex((item) => item.id === id);

    documentation.functions.splice(index, 1);
    if (documentation.functions.length === 0) {
      documentation.functions = undefined;
    }
    if (this.canDelete(documentation)) {
      return this.classRepository.delete(documentation.id);
    }
    return this.classRepository.update(documentation);
  }

  update(documentation: ClassDocumentation): Observable<void> {
    return this.classRepository.update(documentation);
  }

  prepareMerge(file: ClassDocumentation[]): Observable<ClassMergeOperation[]> {
    return this.getAll().pipe(
      map((browser: ClassDocumentation[]) => {
        const operations: ClassMergeOperation[] = [];

        // Detect delete / update operations
        browser.forEach((browserObject) => {
          const fileObject: ClassDocumentation | undefined = file.find((item) => item.id === browserObject.id);

          if (!fileObject) {
            operations.push({
              id: browserObject.id,
              operation: MergeOperation.delete,
              body: {
                id: browserObject.id,
                operation: MergeOperation.delete,
                browser: browserObject.body
              },
              members: browserObject.functions?.map((member) => <MemberMergeOperation>{
                id: member.id,
                operation: MergeOperation.delete,
                browser: member.body
              })
            });
            return;
          }
          const body: BodyMergeOperation | undefined = this.mergeClassBody(browserObject, fileObject);
          const members: MemberMergeOperation[] = this.mergeClassMembers(browserObject.functions ?? [], fileObject.functions ?? []);

          if (body === undefined && members.length === 0) {
            return;
          }
          operations.push({
            id: browserObject.id,
            operation: MergeOperation.none,
            body: body,
            members: members
          });
        });
        // Detect add operations
        file.forEach((fileObject) => {
          const browserObject: ClassDocumentation | undefined = browser.find((item) => item.id === fileObject.id);

          if (browserObject) {
            return;
          }
          let body: BodyMergeOperation | undefined;

          if (fileObject.body) {
            body = <BodyMergeOperation>{
              id: fileObject.id,
              operation: MergeOperation.add,
              file: fileObject.body,
              from: MergeFrom.file
            };
          }
          const members: MemberMergeOperation[] | undefined = fileObject.functions?.map((func) => {
            return <MemberMergeOperation>{
              id: func.id,
              operation: MergeOperation.add,
              file: func.body,
              from: MergeFrom.file
            };
          });

          operations.push({
            id: fileObject.id,
            operation: MergeOperation.add,
            body: body,
            members: members
          });
        });
        return operations;
      })
    );
  }

  merge(operations: ClassMergeOperation[], classes: ClassDocumentation[]): Observable<void> {
    const operations$: Observable<any>[] = [];

    operations$.push(...this.mergeDeletions(operations, classes));
    operations$.push(...this.mergeAdditions(operations, classes));
    operations$.push(...this.mergeModifications(operations, classes));
    return zip(operations$).pipe(mergeAll());
  }

  replaceAll(objects: ClassDocumentation[]): Observable<void> {
    return this.classRepository.deleteAll().pipe(
      switchMap(() => {
        const operations$: Observable<void>[] = [];

        for (const object of objects) {
          operations$.push(this.classRepository.create(object));
        }
        return operations$;
      }),
      zipAll(),
      mergeAll()
    );
  }

  private canDelete(documentation: ClassDocumentation): boolean {
    return !documentation.body && !documentation.functions;
  }

  private mergeClassBody(browser: ClassDocumentation, file: ClassDocumentation): BodyMergeOperation | undefined {
    if (browser.body === file.body) {
      return undefined;
    }
    let operation: MergeOperation;

    if (browser.body && file.body) {
      operation = MergeOperation.update;
    } else if (browser.body && !file.body) {
      operation = MergeOperation.delete;
    } else {
      operation = MergeOperation.add;
    }
    return {
      id: browser.id,
      operation: operation,
      browser: browser.body,
      file: file.body,
      from: operation === MergeOperation.add ? MergeFrom.file : undefined
    };
  }

  private mergeClassMembers(browser: MemberDocumentation[], file: MemberDocumentation[]): MemberMergeOperation[] {
    const operations: MemberMergeOperation[] = [];

    // Detect delete / update operations.
    browser.forEach((browserMember) => {
      const fileMember: MemberDocumentation | undefined = file.find((item) => item.id === browserMember.id);

      if (!fileMember) {
        operations.push({
          id: browserMember.id,
          operation: MergeOperation.delete,
          browser: browserMember.body
        });
        return;
      }
      if (browserMember.body === fileMember.body) {
        return;
      }
      operations.push({
        id: browserMember.id,
        operation: MergeOperation.update,
        browser: browserMember.body,
        file: fileMember.body
      });
    });
    // Detect add operations
    file.forEach((fileMember) => {
      const browserMember: MemberDocumentation | undefined = browser.find((item) => item.id === fileMember.id);

      if (browserMember) {
        return;
      }
      operations.push({
        id: fileMember.id,
        operation: MergeOperation.add,
        file: fileMember.body,
        from: MergeFrom.file
      });
    });
    return operations;
  }

  private mergeDeletions(operations: ClassMergeOperation[], classes: ClassDocumentation[]): Observable<void>[] {
    return operations
      .filter((operation) => {
        if (operation.operation === MergeOperation.delete) {
          return true;
        }
        if (operation.body &&
          operation.body.from === MergeFrom.file &&
          operation.body.operation === MergeOperation.delete) {
          return true;
        }
        const members: MemberMergeOperation[] = operation.members ?? [];

        for (const member of members) {
          if (member.from === MergeFrom.file && member.operation === MergeOperation.delete) {
            return true;
          }
        }
        return false;
      })
      .flatMap((operation) => {
        if (operation.operation === MergeOperation.delete) {
          return this.classRepository.delete(operation.id);
        }
        const documentation: ClassDocumentation | undefined = classes.find((item) => item.id === operation.id);

        if (!documentation) {
          return [];
        }
        const operations$: Observable<void>[] = [];

        if (operation.body &&
          operation.body.from === MergeFrom.file &&
          operation.body.operation === MergeOperation.delete) {
          documentation.body = undefined;
          operations$.push(this.classRepository.update(documentation));
        }
        const members: MemberMergeOperation[] = operation.members ?? [];

        for (const member of members) {
          if (member.from === MergeFrom.file && member.operation === MergeOperation.delete) {
            operations$.push(this.deleteFunction(documentation, member.id));
          }
        }
        return operations$;
      });
  }

  private mergeAdditions(operations: ClassMergeOperation[], classes: ClassDocumentation[]): Observable<void>[] {
    return operations
      .filter((operation) => {
        if (operation.operation === MergeOperation.add) {
          return true;
        }
        if (operation.body &&
          operation.body.from === MergeFrom.file &&
          operation.body.operation === MergeOperation.add) {
          return true;
        }
        const members: MemberMergeOperation[] = operation.members ?? [];

        for (const member of members) {
          if (member.from === MergeFrom.file && member.operation === MergeOperation.add) {
            return true;
          }
        }
        return false;
      })
      .flatMap((operation) => {
        if (operation.operation === MergeOperation.add) {
          console.log('<add />', operation);
          const documentation: ClassDocumentation = {
            id: operation.id,
            body: operation.body?.file,
            functions: operation.members?.map((member) => {
              return <MemberDocumentation>{
                id: member.id,
                body: member.file,
              };
            })
          }

          return this.classRepository.create(documentation);
        }
        const documentation: ClassDocumentation | undefined = classes.find((item) => item.id === operation.id);

        if (!documentation) {
          return [];
        }
        const operations$: Observable<void>[] = [];

        if (operation.body &&
          operation.body.from === MergeFrom.file &&
          operation.body.operation === MergeOperation.add) {
          documentation.body = operation.body.file;
          operations$.push(this.classRepository.update(documentation));
        }
        const members: MemberMergeOperation[] = operation.members ?? [];

        for (const member of members) {
          if (member.from === MergeFrom.file && member.operation === MergeOperation.add) {
            const func: MemberDocumentation = {
              id: member.id,
              body: member.file!
            };

            operations$.push(this.addFunction(documentation, func));
          }
        }
        return operations$;
      });
  }

  private mergeModifications(operations: ClassMergeOperation[], classes: ClassDocumentation[]): Observable<void>[] {
    return operations
      .filter((operation) => {
        if (operation.body &&
          operation.body.from === MergeFrom.file &&
          operation.body.operation === MergeOperation.update) {
          return true;
        }
        const members: MemberMergeOperation[] = operation.members ?? [];

        for (const member of members) {
          if (member.from === MergeFrom.file && member.operation === MergeOperation.update) {
            return true;
          }
        }
        return false;
      })
      .flatMap((operation) => {
        const documentation: ClassDocumentation | undefined = classes.find((item) => item.id === operation.id);

        if (!documentation) {
          return [];
        }
        const operations$: Observable<void>[] = [];

        if (operation.body &&
          operation.body.from === MergeFrom.file &&
          operation.body.operation === MergeOperation.update) {
          documentation.body = operation.body.file;
          operations$.push(this.classRepository.update(documentation));
        }
        const members: MemberMergeOperation[] = operation.members ?? [];

        for (const member of members) {
          if (member.from === MergeFrom.file && member.operation === MergeOperation.update) {
            const func: MemberDocumentation | undefined = documentation.functions?.find((item) => item.id === member.id);

            if (func) {
              func.body = member.file!;
              operations$.push(this.classRepository.update(documentation));
            }
          }
        }
        return operations$;
      });
  }

}
