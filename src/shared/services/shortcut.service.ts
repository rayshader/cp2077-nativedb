import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ShortcutService {

  private readonly keySubject: BehaviorSubject<string> = new BehaviorSubject<string>('');

  public get usageShortcut(): boolean {
    return this.keySubject.value === 'u';
  }

  pushKey(key: string): void {
    this.keySubject.next(key.toLowerCase());
  }

}
