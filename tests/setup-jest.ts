import {setupZoneTestEnv} from "jest-preset-angular/setup-env/zone/index.js";

setupZoneTestEnv();

console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
