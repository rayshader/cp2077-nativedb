export const DateMock = {
  now: jest.spyOn(Date, 'now'),

  mockResetAll: () => {
    DateMock.now.mockReset();
  }
};
