import {EMPTY, of} from "rxjs";

export const RedDumpServiceMock = {
  isReady$: EMPTY,

  getById: jest.fn(),

  mockIsReady(value: boolean): void {
    Object.defineProperty(this, 'isReady$', {
      get: () => of(value)
    });
  },

  mockResetAll() {
    RedDumpServiceMock.getById.mockReset();
  }
}
