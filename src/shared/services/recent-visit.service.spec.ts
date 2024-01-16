import {StorageMock} from "../../../tests/storage.mock";
import {RecentVisitItem, RecentVisitService} from "./recent-visit.service";
import {DateMock} from "../../../tests/date.mock";

describe('RecentVisitService', () => {
  let service: RecentVisitService;

  afterEach(() => {
    StorageMock.mockResetAll();
    DateMock.mockResetAll();
  });

  describe('getAll()', () => {
    it('given storage is empty then return an empty array', () => {
      // GIVEN
      service = new RecentVisitService();

      // WHEN
      const items: RecentVisitItem[] = service.getAll();

      // THEN
      expect(items).toHaveLength(0);
    });

    it('given storage contains items then return all items', () => {
      // GIVEN
      const data: RecentVisitItem[] = [
        {id: 0, visitedAt: 1704114000},
        {id: 1, visitedAt: 1704114001},
        {id: 2, visitedAt: 1704114002},
        {id: 3, visitedAt: 1704114003},
        {id: 5, visitedAt: 1704114004},
      ];

      StorageMock.getItem.mockReturnValueOnce(JSON.stringify(data));
      service = new RecentVisitService();

      // WHEN
      const items: RecentVisitItem[] = service.getAll();

      // THEN
      expect(items).toHaveLength(5);
      expect(items).toEqual(data);
    });

    it('should return an immutable array of items', () => {
      // GIVEN
      const data: RecentVisitItem[] = [{id: 0, visitedAt: 1704114000}];

      StorageMock.getItem.mockReturnValue(JSON.stringify(data));
      service = new RecentVisitService();
      const items: RecentVisitItem[] = service.getAll();

      // WHEN
      items.push({id: 1, visitedAt: 1704114001});
      expect(items).toHaveLength(2);
      const immutableItems = service.getAll();

      // THEN
      expect(immutableItems).toHaveLength(1);
      expect(immutableItems).toEqual(data);
    });
  });

  describe('pushLastVisit(id)', () => {
    it('given a new visit then visit is added in cache', () => {
      // GIVEN
      DateMock.now.mockReturnValueOnce(1704114000);

      service = new RecentVisitService();
      let items: RecentVisitItem[] = service.getAll();

      expect(items).toHaveLength(0);

      // WHEN
      service.pushLastVisit(0);

      // THEN
      items = service.getAll();
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({id: 0, visitedAt: 1704114000});
    });

    it('given a new visit then visit is saved in storage', () => {
      // GIVEN
      DateMock.now.mockReturnValueOnce(1704114000);

      service = new RecentVisitService();
      let items: RecentVisitItem[] = service.getAll();

      expect(items).toHaveLength(0);

      // WHEN
      service.pushLastVisit(0);

      // THEN
      expect(StorageMock.setItem).toHaveBeenCalledWith('recent-visits', JSON.stringify([
        {id: 0, visitedAt: 1704114000}
      ]));
    });

    it('given a more recent visit then visit is updated in cache', () => {
      // GIVEN
      DateMock.now.mockReturnValueOnce(1704115000);
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify([
        {id: 0, visitedAt: 1704114000},
        {id: 1, visitedAt: 1704114001},
      ]));

      service = new RecentVisitService();
      let items: RecentVisitItem[] = service.getAll();

      expect(items).toHaveLength(2);

      // WHEN
      service.pushLastVisit(0);

      // THEN
      items = service.getAll();
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({id: 1, visitedAt: 1704114001});
      expect(items[1]).toEqual({id: 0, visitedAt: 1704115000});
    });

    it('given a more recent visit then visit is saved in storage', () => {
      // GIVEN
      DateMock.now.mockReturnValueOnce(1704115000);
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify([
        {id: 0, visitedAt: 1704114000},
        {id: 1, visitedAt: 1704114001},
      ]));

      service = new RecentVisitService();
      let items: RecentVisitItem[] = service.getAll();

      expect(items).toHaveLength(2);

      // WHEN
      service.pushLastVisit(0);

      // THEN
      expect(StorageMock.setItem).toHaveBeenCalledWith('recent-visits', JSON.stringify([
        {id: 1, visitedAt: 1704114001},
        {id: 0, visitedAt: 1704115000}
      ]));
    });

    it('given a new visit ' +
      'when limit is reached ' +
      'then oldest visit is removed and visit is updated in cache', () => {
      // GIVEN
      const data: RecentVisitItem[] = [];

      for (let i = 0; i < 50; i++) {
        data.push({id: i, visitedAt: 1704114000 + i});
      }
      DateMock.now.mockReturnValueOnce(1704115000);
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify(data));

      service = new RecentVisitService();
      let items: RecentVisitItem[] = service.getAll();

      expect(items).toHaveLength(50);

      // WHEN
      service.pushLastVisit(51);

      // THEN
      items = service.getAll();
      expect(items).toHaveLength(50);
      expect(items[0]).toEqual({id: 1, visitedAt: 1704114001});
      expect(items[49]).toEqual({id: 51, visitedAt: 1704115000});
    });

    it('given a new visit ' +
      'when limit is reached ' +
      'then oldest visit is removed and visit is saved in storage', () => {
      // GIVEN
      const data: RecentVisitItem[] = [];

      for (let i = 0; i < 50; i++) {
        data.push({id: i, visitedAt: 1704114000 + i});
      }
      DateMock.now.mockReturnValueOnce(1704115000);
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify(data));

      service = new RecentVisitService();
      let items: RecentVisitItem[] = service.getAll();

      expect(items).toHaveLength(50);

      // WHEN
      service.pushLastVisit(51);

      // THEN
      data.splice(0, 1);
      data.push({id: 51, visitedAt: 1704115000});
      expect(StorageMock.setItem).toHaveBeenCalledWith('recent-visits', JSON.stringify(data));
    });
  });

  describe('clear()', () => {
    it('given a list of visits then all visits are removed from cache', () => {
      // GIVEN
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify([
        {id: 0, visitedAt: 1704114000},
        {id: 1, visitedAt: 1704114001},
      ]));

      service = new RecentVisitService();
      let items: RecentVisitItem[] = service.getAll();

      expect(items).toHaveLength(2);

      // WHEN
      service.clear();

      // THEN
      items = service.getAll();
      expect(items).toHaveLength(0);
    });

    it('given a list of visits then all visits are removed from storage', () => {
      // GIVEN
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify([
        {id: 0, visitedAt: 1704114000},
        {id: 1, visitedAt: 1704114001},
      ]));

      service = new RecentVisitService();
      let items: RecentVisitItem[] = service.getAll();

      expect(items).toHaveLength(2);

      // WHEN
      service.clear();

      // THEN
      expect(StorageMock.setItem).toHaveBeenCalledWith('recent-visits', JSON.stringify([]));
    });
  });
});
