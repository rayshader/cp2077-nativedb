import {Injectable} from "@angular/core";

export interface RecentVisitItem {
  readonly id: number;
  readonly visitedAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecentVisitService {

  private readonly recentVisits: RecentVisitItem[] = [];
  private maximum: number = 50;

  constructor() {
    const json: string = localStorage.getItem('recent-visits') ?? '[]';

    this.recentVisits.push(...JSON.parse(json));
  }

  getAll(): RecentVisitItem[] {
    return this.recentVisits;
  }

  pushLastVisit(id: number): void {
    const i: number = this.recentVisits.findIndex((item) => item.id === id);

    if (i !== -1) {
      this.recentVisits.splice(i, 1);
    }
    if (this.recentVisits.length + 1 > this.maximum) {
      this.recentVisits.splice(0, 1);
    }
    this.recentVisits.push({
      id: id,
      visitedAt: Date.now(),
    });
    this.save();
  }

  clear(): void {
    this.recentVisits.length = 0;
    this.save();
  }

  private save(): void {
    const json: string = JSON.stringify(this.recentVisits);

    localStorage.setItem('recent-visits', json);
  }

}
