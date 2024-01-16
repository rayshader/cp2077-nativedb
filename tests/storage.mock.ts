export const StorageMock = {
  getItem: jest.spyOn(Storage.prototype, 'getItem'),
  setItem: jest.spyOn(Storage.prototype, 'setItem'),
  removeItem: jest.spyOn(Storage.prototype, 'removeItem'),
  clear: jest.spyOn(Storage.prototype, 'clear'),

  mockResetAll: () => {
    StorageMock.getItem.mockReset();
    StorageMock.setItem.mockReset();
    StorageMock.removeItem.mockReset();
    StorageMock.clear.mockReset();
  }
};
