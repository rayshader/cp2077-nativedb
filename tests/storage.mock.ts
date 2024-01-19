export const StorageMock = {
  getItem: jest.spyOn(Storage.prototype, 'getItem'),
  setItem: jest.spyOn(Storage.prototype, 'setItem'),
  removeItem: jest.spyOn(Storage.prototype, 'removeItem'),
  clear: jest.spyOn(Storage.prototype, 'clear'),

  mockItems(items: {[key: string]: any}): void {
    this.getItem.mockImplementation((key: string): string | null => {
      if (key in items) {
        return items[key].toString();
      }
      return null;
    });
  },

  mockResetAll: () => {
    StorageMock.getItem.mockReset();
    StorageMock.setItem.mockReset();
    StorageMock.removeItem.mockReset();
    StorageMock.clear.mockReset();
  }
};
