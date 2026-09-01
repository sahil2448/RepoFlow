// Backend/jest.config.js
export default {
  testEnvironment: "node",
  // One worker keeps the in-memory MongoDB + module state simple and reliable.
  maxWorkers: 1,
  testMatch: ["**/tests/**/*.test.js"],
  globalSetup: "<rootDir>/tests/global-setup.js",
  globalTeardown: "<rootDir>/tests/global-teardown.js",
  // setupFiles run before any test module imports — this is where we inject
  // process.env (MONGO_URI etc.) so controllers read the test database.
  setupFiles: ["<rootDir>/tests/jest-setup-env.js"],
  transform: {},
  verbose: true,
};