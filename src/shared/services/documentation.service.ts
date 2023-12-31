import {Injectable} from "@angular/core";
import {Entity} from "../repositories/crud.repository";
import {ClassRepository} from "../repositories/class.repository";
import {map, Observable, switchMap} from "rxjs";

export interface ClassDocumentation extends Entity {
  body?: string;
  functions?: MemberDocumentation[];
}

export interface MemberDocumentation {
  readonly id: number;

  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {

  constructor(private readonly classRepository: ClassRepository) {
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

  private canDelete(documentation: ClassDocumentation): boolean {
    return !documentation.body && !documentation.functions;
  }

}
