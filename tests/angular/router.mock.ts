export const RouterMock = {
  navigate: jest.fn(),

  mockResetAll() {
    RouterMock.navigate.mockReset();
  }
}
