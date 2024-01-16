import Mock = jest.Mock;

export interface MatchMediaMock {
  mediaQuery: Mock<MediaQueryList>;
  listener?: Function;

  dispatch(): void;
}

export function mockMatchMedia(): MatchMediaMock {
  const mock: MatchMediaMock = {
    dispatch() {
      this.listener?.call(null);
    },

    mediaQuery: jest.fn().mockImplementation((query) => {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn().mockImplementation((type, fn) => {
          mock.listener = fn;
        }),
        removeEventListener: jest.fn().mockImplementation((type, fn) => {
          if (mock.listener !== fn) {
            return;
          }
          mock.listener = undefined;
        }),
        dispatchEvent: jest.fn()
      };
    })
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mock.mediaQuery
  });
  return mock;
}
