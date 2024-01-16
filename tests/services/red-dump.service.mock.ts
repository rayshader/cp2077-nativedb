export const RedDumpServiceMock = {
  getById: jest.fn(),

  mockResetAll() {
    RedDumpServiceMock.getById.mockReset();
  }
}
