export const SearchServiceMock = {
  requestSearch: jest.fn(),

  mockResetAll() {
    SearchServiceMock.requestSearch.mockReset();
  }
}
