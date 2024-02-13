export const RouterMock = {
  navigate: jest.fn(),
  createUrlTree: jest.fn(),
  serializeUrl: jest.fn(),

  mockResetAll() {
    RouterMock.navigate.mockReset();
    RouterMock.createUrlTree.mockReset();
    RouterMock.serializeUrl.mockReset();
  }
}
