import type {Config} from 'jest';
import {createCjsPreset} from "jest-preset-angular/build/presets/create-cjs-preset.js";

export default {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['./tests/setup-jest.ts'],
  transformIgnorePatterns: ['node_modules/(?!.*(?:\\.mjs$|marked|@angular|rxjs|ngxtension|tslib))'],
  coveragePathIgnorePatterns: ['./tests/']
} satisfies Config;
