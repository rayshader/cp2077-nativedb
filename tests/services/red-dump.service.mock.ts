import {signal} from "@angular/core";

export const RedDumpServiceMock = {
  isReady: signal<boolean>(false),

  getById: jest.fn(),

  mockIsReady(value: boolean): void {
    this.isReady.set(value);
  },

  mockResetAll() {
    RedDumpServiceMock.getById.mockReset();
  }
}
