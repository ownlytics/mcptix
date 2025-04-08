// Mock chalk before imports
import chalk from 'chalk';
import { Logger } from './logger';

jest.mock('chalk', () => ({
  blue: jest.fn(text => `BLUE:${text}`),
  green: jest.fn(text => `GREEN:${text}`),
  yellow: jest.fn(text => `YELLOW:${text}`),
  red: jest.fn(text => `RED:${text}`),
  gray: jest.fn(text => `GRAY:${text}`),
  cyan: jest.fn(text => `CYAN:${text}`),
  white: jest.fn(text => `WHITE:${text}`),
  magenta: jest.fn(text => `MAGENTA:${text}`),
}));

describe('Logger', () => {
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  // Setup mocks before each test
  beforeEach(() => {
    // Reset console mocks
    console.log = jest.fn();
    console.error = jest.fn();

    // Reset chalk mocks
    (chalk.blue as jest.MockedFunction<typeof chalk.blue>).mockClear();
    (chalk.green as jest.MockedFunction<typeof chalk.green>).mockClear();
    (chalk.yellow as jest.MockedFunction<typeof chalk.yellow>).mockClear();
    (chalk.red as jest.MockedFunction<typeof chalk.red>).mockClear();
    (chalk.gray as jest.MockedFunction<typeof chalk.gray>).mockClear();
    (chalk.cyan as jest.MockedFunction<typeof chalk.cyan>).mockClear();
    (chalk.white as jest.MockedFunction<typeof chalk.white>).mockClear();
    (chalk.magenta as jest.MockedFunction<typeof chalk.magenta>).mockClear();

    // Reset logger config to default
    Logger.configure({
      enableColors: true,
      showTimestamp: true,
      logLevel: 'debug',
    });
  });

  // Restore original console methods after all tests
  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  // Basic test to make sure the logger doesn't crash
  test('should log a message', () => {
    Logger.info('Test', 'This is a test message');
    expect(console.log).toHaveBeenCalled();
  });
});
