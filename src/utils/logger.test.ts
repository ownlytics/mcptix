// Mock chalk before imports
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

import chalk from 'chalk';

import { Logger } from './logger';

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

  describe('configure', () => {
    test('should update configuration', () => {
      Logger.configure({
        enableColors: false,
        showTimestamp: false,
        logLevel: 'error',
      });

      // Log something to test the config
      Logger.info('Test', 'Message');

      // Verify timestamp is not included
      expect((console.log as jest.Mock).mock.calls[0][0]).not.toMatch(/\[\d{4}-\d{2}-\d{2}T/);

      // Verify colors are not used
      expect(chalk.blue).not.toHaveBeenCalled();
    });

    test('should merge with existing configuration', () => {
      // Only update one property
      Logger.configure({
        enableColors: false,
      });

      // Log something to test the config
      Logger.info('Test', 'Message');

      // Verify timestamp is still included (default true)
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(/\[\d{4}-\d{2}-\d{2}T/);

      // Verify colors are not used
      expect(chalk.blue).not.toHaveBeenCalled();
    });
  });

  describe('log level methods', () => {
    test('info should log with blue color', () => {
      Logger.info('Component', 'Info message');

      expect(chalk.blue).toHaveBeenCalledWith('[Component]');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /BLUE:\[Component\] Info message/,
      );
    });

    test('success should log with green color', () => {
      Logger.success('Component', 'Success message');

      expect(chalk.green).toHaveBeenCalledWith('[Component]');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /GREEN:\[Component\] Success message/,
      );
    });

    test('warn should log with yellow color', () => {
      Logger.warn('Component', 'Warning message');

      expect(chalk.yellow).toHaveBeenCalledWith('[Component]');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /YELLOW:\[Component\] Warning message/,
      );
    });

    test('error should log with red color', () => {
      Logger.error('Component', 'Error message');

      expect(chalk.red).toHaveBeenCalledWith('[Component]');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /RED:\[Component\] Error message/,
      );
    });

    test('debug should log with gray color when in debug mode', () => {
      Logger.debug('Component', 'Debug message');

      expect(chalk.gray).toHaveBeenCalledWith('[Component]');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /GRAY:\[Component\] Debug message/,
      );
    });

    test('debug should not log when not in debug mode', () => {
      Logger.configure({ logLevel: 'info' });
      Logger.debug('Component', 'Debug message');

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('error logging with error objects', () => {
    test('should log error details for Error objects', () => {
      const error = new Error('Test error');
      Logger.error('Component', 'Error occurred', error);

      expect(console.log).toHaveBeenCalledTimes(1);
      // Don't check exact number of calls as stack trace length can vary
      expect(console.error).toHaveBeenCalled();
      expect((console.error as jest.Mock).mock.calls[0][0]).toBe('RED:  Error details:');
      expect((console.error as jest.Mock).mock.calls[0][1]).toBe('Test error');
      expect((console.error as jest.Mock).mock.calls[1][0]).toBe('RED:  Stack trace:');
    });

    test('should handle non-Error objects', () => {
      Logger.error('Component', 'Error occurred', 'String error');

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect((console.error as jest.Mock).mock.calls[0][0]).toBe('RED:  Error details:');
      expect((console.error as jest.Mock).mock.calls[0][1]).toBe('String error');
    });

    test('should handle Error objects without stack', () => {
      const error = new Error('Test error');
      delete error.stack;

      Logger.error('Component', 'Error occurred', error);

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect((console.error as jest.Mock).mock.calls[0][0]).toBe('RED:  Error details:');
      expect((console.error as jest.Mock).mock.calls[0][1]).toBe('Test error');
    });
  });

  describe('HTTP request logging', () => {
    test('should log GET requests with green color', () => {
      Logger.request('GET', '/api/test', 200, 123);

      expect(chalk.green).toHaveBeenCalledWith('GET    ');
      expect(chalk.green).toHaveBeenCalledWith('200');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /CYAN:\[API\] GREEN:GET     \/api\/test GREEN:200 123ms/,
      );
    });

    test('should log POST requests with blue color', () => {
      Logger.request('POST', '/api/test', 201, 123);

      expect(chalk.blue).toHaveBeenCalledWith('POST   ');
      expect(chalk.green).toHaveBeenCalledWith('201');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /CYAN:\[API\] BLUE:POST    \/api\/test GREEN:201 123ms/,
      );
    });

    test('should log PUT requests with yellow color', () => {
      Logger.request('PUT', '/api/test', 200, 123);

      expect(chalk.yellow).toHaveBeenCalledWith('PUT    ');
      expect(chalk.green).toHaveBeenCalledWith('200');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /CYAN:\[API\] YELLOW:PUT     \/api\/test GREEN:200 123ms/,
      );
    });

    test('should log DELETE requests with red color', () => {
      Logger.request('DELETE', '/api/test', 204, 123);

      expect(chalk.red).toHaveBeenCalledWith('DELETE ');
      expect(chalk.green).toHaveBeenCalledWith('204');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /CYAN:\[API\] RED:DELETE  \/api\/test GREEN:204 123ms/,
      );
    });

    test('should log PATCH requests with magenta color', () => {
      Logger.request('PATCH', '/api/test', 200, 123);

      expect(chalk.magenta).toHaveBeenCalledWith('PATCH  ');
      expect(chalk.green).toHaveBeenCalledWith('200');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /CYAN:\[API\] MAGENTA:PATCH   \/api\/test GREEN:200 123ms/,
      );
    });

    test('should log other HTTP methods with white color', () => {
      Logger.request('OPTIONS', '/api/test', 200, 123);

      expect(chalk.white).toHaveBeenCalledWith('OPTIONS');
      expect(chalk.green).toHaveBeenCalledWith('200');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /CYAN:\[API\] WHITE:OPTIONS \/api\/test GREEN:200 123ms/,
      );
    });

    test('should color status codes correctly', () => {
      // 2xx - green
      Logger.request('GET', '/api/test', 200);
      expect(chalk.green).toHaveBeenCalledWith('200');

      // 3xx - cyan
      Logger.request('GET', '/api/test', 301);
      expect(chalk.cyan).toHaveBeenCalledWith('301');

      // 4xx - yellow
      Logger.request('GET', '/api/test', 404);
      expect(chalk.yellow).toHaveBeenCalledWith('404');

      // 5xx - red
      Logger.request('GET', '/api/test', 500);
      expect(chalk.red).toHaveBeenCalledWith('500');
    });

    test('should handle missing status and time', () => {
      Logger.request('GET', '/api/test');

      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /CYAN:\[API\] GREEN:GET     \/api\/test/,
      );
      expect((console.log as jest.Mock).mock.calls[0][0]).not.toMatch(/ms/);
    });

    test('should handle missing time but with status', () => {
      Logger.request('GET', '/api/test', 200);

      expect(console.log).toHaveBeenCalledTimes(1);
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /CYAN:\[API\] GREEN:GET     \/api\/test GREEN:200/,
      );
      expect((console.log as jest.Mock).mock.calls[0][0]).not.toMatch(/ms/);
    });
  });

  describe('timestamp formatting', () => {
    test('should include timestamp when showTimestamp is true', () => {
      Logger.configure({ showTimestamp: true });
      Logger.info('Component', 'Message');

      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });

    test('should not include timestamp when showTimestamp is false', () => {
      Logger.configure({ showTimestamp: false });
      Logger.info('Component', 'Message');

      expect((console.log as jest.Mock).mock.calls[0][0]).not.toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('edge cases', () => {
    test('should handle unknown log level', () => {
      // We need to access the private getColor method
      const colorFn = Logger['getColor']('unknown-level' as any);

      expect(colorFn('test')).toBe('WHITE:test');
    });

    test('should handle unknown status code', () => {
      // We need to access the private getStatusColor method
      const colorFn = Logger['getStatusColor'](0);

      expect(colorFn('test')).toBe('WHITE:test');
    });
  });

  describe('color formatting', () => {
    test('should use colors when enableColors is true', () => {
      Logger.configure({ enableColors: true });
      Logger.info('Component', 'Message');

      expect(chalk.blue).toHaveBeenCalled();
    });

    test('should not use colors when enableColors is false', () => {
      Logger.configure({ enableColors: false });
      Logger.info('Component', 'Message');

      expect(chalk.blue).not.toHaveBeenCalled();
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(/\[Component\] Message/);
    });

    test('should not use colors for HTTP methods when enableColors is false', () => {
      Logger.configure({ enableColors: false });
      Logger.request('GET', '/api/test', 200);

      expect(chalk.green).not.toHaveBeenCalled();
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /\[API\] GET     \/api\/test 200/,
      );
    });

    test('should not use colors for status codes when enableColors is false', () => {
      Logger.configure({ enableColors: false });
      Logger.request('GET', '/api/test', 500);

      expect(chalk.red).not.toHaveBeenCalled();
      expect((console.log as jest.Mock).mock.calls[0][0]).toMatch(
        /\[API\] GET     \/api\/test 500/,
      );
    });
  });
});
