import { defaultConfig, mergeConfig, validateConfig, McpTixConfig } from '../config';

describe('Config Module', () => {
  describe('defaultConfig', () => {
    test('should have expected default values', () => {
      expect(defaultConfig).toEqual({
        dbPath: './data/mcptix.db',
        apiPort: 3000,
        apiHost: 'localhost',
        mcpEnabled: false,
        apiEnabled: true,
        logLevel: 'info',
        clearDataOnInit: false,
      });
    });
  });

  describe('mergeConfig', () => {
    test('should return default config when no user config is provided', () => {
      const result = mergeConfig();
      expect(result).toEqual(defaultConfig);
    });

    test('should merge user config with default config', () => {
      const userConfig: Partial<McpTixConfig> = {
        dbPath: '/custom/path/db.sqlite',
        apiPort: 4000,
        logLevel: 'debug',
      };

      const expected = {
        ...defaultConfig,
        ...userConfig,
      };

      const result = mergeConfig(userConfig);
      expect(result).toEqual(expected);
    });

    test('should override all default values when provided', () => {
      const userConfig: McpTixConfig = {
        dbPath: '/custom/path/db.sqlite',
        apiPort: 4000,
        apiHost: '0.0.0.0',
        mcpEnabled: true,
        apiEnabled: false,
        logLevel: 'debug',
        clearDataOnInit: true,
      };

      const result = mergeConfig(userConfig);
      expect(result).toEqual(userConfig);
    });
  });

  describe('validateConfig', () => {
    test('should not throw for valid config', () => {
      const config: McpTixConfig = {
        dbPath: '/valid/path/db.sqlite',
        apiPort: 3000,
        apiHost: 'localhost',
        mcpEnabled: true,
        apiEnabled: true,
        logLevel: 'info',
        clearDataOnInit: false,
      };

      expect(() => validateConfig(config)).not.toThrow();
    });

    test('should throw for invalid port number (negative)', () => {
      const config: McpTixConfig = {
        ...defaultConfig,
        apiPort: -1,
      };

      expect(() => validateConfig(config)).toThrow(
        'Invalid API port: -1. Must be between 0 and 65535.',
      );
    });

    test('should throw for invalid port number (too large)', () => {
      const config: McpTixConfig = {
        ...defaultConfig,
        apiPort: 65536,
      };

      expect(() => validateConfig(config)).toThrow(
        'Invalid API port: 65536. Must be between 0 and 65535.',
      );
    });

    test('should throw for invalid log level', () => {
      const config: McpTixConfig = {
        ...defaultConfig,
        logLevel: 'invalid' as any,
      };

      expect(() => validateConfig(config)).toThrow(
        'Invalid log level: invalid. Must be one of: debug, info, warn, error.',
      );
    });

    test('should not throw when optional properties are undefined', () => {
      const config: McpTixConfig = {};
      expect(() => validateConfig(config)).not.toThrow();
    });
  });
});
