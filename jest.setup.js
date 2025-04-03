// Set a longer timeout for tests that might take longer to run
jest.setTimeout(10000);

// Silence console logs during tests unless explicitly enabled
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    // Keep error and warn for debugging
    error: console.error,
    warn: console.warn,
  };
}

// Add any global test setup here