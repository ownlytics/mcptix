import { defaultConfig, mergeConfig, validateConfig, McpTixConfig } from '../config';

describe('Config Module', () => {
  describe('defaultConfig', () => {
    test('should have expected default values', () => {
      expect(defaultConfig).toMatchObject({
        homeDir: './.mcptix',
        apiPort: 3000,
        apiHost: 'localhost',
        mcpEnabled: false,
        apiEnabled: true,
        logLevel: 'info',
        logFile: 'mcptix.log',
        clearDataOnInit: false,
      });
    });
  });

  describe('mergeConfig', () => {
    test('should return default config when no user config is provided', () => {
      const result = mergeConfig();

      // Check specific properties instead of using toMatchObject
      expect(result.homeDir).toBe(defaultConfig.homeDir);
      expect(result.apiPort).toBe(defaultConfig.apiPort);
      expect(result.apiHost).toBe(defaultConfig.apiHost);
      expect(result.mcpEnabled).toBe(defaultConfig.mcpEnabled);
      expect(result.apiEnabled).toBe(defaultConfig.apiEnabled);
      expect(result.logLevel).toBe(defaultConfig.logLevel);
      expect(result.logFile).toBe(defaultConfig.logFile);
      expect(result.clearDataOnInit).toBe(defaultConfig.clearDataOnInit);

      // Check derived paths
      expect(result.dbPath).toContain('.mcptix/data/mcptix.db');
      expect(result.logDir).toContain('.mcptix/logs');
    });

    test('should merge user config with default config', () => {
      const userConfig: Partial<McpTixConfig> = {
        dbPath: '/custom/path/db.sqlite',
        apiPort: 4000,
        logLevel: 'debug',
      };

      // When custom dbPath is provided, it should override the derived path
      const result = mergeConfig(userConfig);

      // Check that user config overrides default config
      expect(result.dbPath).toBe(userConfig.dbPath);
      expect(result.apiPort).toBe(userConfig.apiPort);
      expect(result.logLevel).toBe(userConfig.logLevel);

      // Check that other properties are preserved
      expect(result.homeDir).toBe(defaultConfig.homeDir);
      expect(result.apiHost).toBe(defaultConfig.apiHost);
      expect(result.mcpEnabled).toBe(defaultConfig.mcpEnabled);
      expect(result.apiEnabled).toBe(defaultConfig.apiEnabled);
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

      // Verify each property individually
      Object.keys(userConfig).forEach(key => {
        expect(result[key as keyof McpTixConfig]).toBe(userConfig[key as keyof McpTixConfig]);
      });
    });
  });

  describe('validateConfig', () => {
    test('should not throw for valid config', () => {
      const config: McpTixConfig = {
        homeDir: '/valid/path',
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

      expect(() => validateConfig(config)).toThrow('Invalid API port: -1. Must be between 0 and 65535.');
    });

    test('should throw for invalid port number (too large)', () => {
      const config: McpTixConfig = {
        ...defaultConfig,
        apiPort: 65536,
      };

      expect(() => validateConfig(config)).toThrow('Invalid API port: 65536. Must be between 0 and 65535.');
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
      // homeDir is required now, so we need to provide it
      const config: McpTixConfig = {
        homeDir: './.mcptix',
        dbPath: './.mcptix/data/mcptix.db',
      };
      expect(() => validateConfig(config)).not.toThrow();
    });
  });
});
