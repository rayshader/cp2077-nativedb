import {BookmarkService} from "./bookmark.service";
import {StorageMock} from "../../../tests/storage.mock";

describe('BookmarkService', () => {
  let service: BookmarkService;

  afterEach(() => {
    StorageMock.mockResetAll();
  });

  describe('getAll()', () => {
    it('given storage is empty then return an empty array', () => {
      service = new BookmarkService();
      const bookmarks: number[] = service.getAll();

      expect(bookmarks).toHaveLength(0);
    });

    it('given storage contains ids then return all ids', () => {
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify([0, 1, 2, 3, 5]));
      service = new BookmarkService();

      const bookmarks: number[] = service.getAll();

      expect(bookmarks).toHaveLength(5);
      expect(bookmarks).toEqual([0, 1, 2, 3, 5]);
    });
  });

  describe('isBookmarked(id)', () => {
    it('given id is 0 when storage is empty then return false', () => {
      service = new BookmarkService();

      const isBookmarked: boolean = service.isBookmarked(0);

      expect(isBookmarked).toBeFalsy();
    });

    it('given id is 5 when storage does not contain id then return false', () => {
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify([0]));
      service = new BookmarkService();

      const isBookmarked: boolean = service.isBookmarked(5);

      expect(isBookmarked).toBeFalsy();
    });

    it('given id is 3 when storage contains id then return true', () => {
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify([3]));
      service = new BookmarkService();

      const isBookmarked: boolean = service.isBookmarked(3);

      expect(isBookmarked).toBeTruthy();
    });
  });

  describe('toggleBookmark(node)', () => {
    beforeEach(() => {
      service = new BookmarkService();
    });

    it('given empty storage when bookmarking a new node then node is added in cache', () => {
      // GIVEN
      let bookmarks: number[] = service.getAll();

      expect(bookmarks).toHaveLength(0);

      // WHEN
      service.toggleBookmark(42);

      // THEN
      bookmarks = service.getAll();
      expect(bookmarks).toEqual([42]);
    });

    it('given empty storage when bookmarking a new node then node is saved in storage', () => {
      // GIVEN
      let bookmarks: number[] = service.getAll();

      expect(bookmarks).toHaveLength(0);

      // WHEN
      service.toggleBookmark(42);

      // THEN
      expect(StorageMock.setItem).toHaveBeenCalledWith('bookmarks', JSON.stringify([42]));
    });

    it('given storage with a node when un-bookmarking node then node is removed from cache', () => {
      // GIVEN
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify([5]));

      service = new BookmarkService();
      let bookmarks: number[] = service.getAll();

      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0]).toBe(5);

      // WHEN
      service.toggleBookmark(5);

      // THEN
      bookmarks = service.getAll();
      expect(bookmarks).toEqual([]);
    });

    it('given storage with a node when un-bookmarking node then node is removed from storage', () => {
      // GIVEN
      StorageMock.getItem.mockReturnValueOnce(JSON.stringify([5]));

      service = new BookmarkService();
      let bookmarks: number[] = service.getAll();

      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0]).toBe(5);

      // WHEN
      service.toggleBookmark(5);

      // THEN
      expect(StorageMock.setItem).toHaveBeenCalledWith('bookmarks', JSON.stringify([]));
    });

  });
});
