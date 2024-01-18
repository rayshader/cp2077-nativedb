export const SettingsServiceMock = {

  get isFirstUsage(): boolean {
    return false
  },

  toggleFirstUsage: jest.fn(),

  mockIsFirstUsage(value: boolean): void {
    Object.defineProperty(this, 'isFirstUsage', {
      get: () => value
    });
  },

  mockResetAll() {
    SettingsServiceMock.toggleFirstUsage.mockReset();
  }
}
