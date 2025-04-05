/**
 * Tests for the init command
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const init = require('./init');

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../utils/package');
jest.mock('../utils/config');

const { updatePackageJson } = require('../utils/package');
const { createConfigFile } = require('../utils/config');

describe('Init Command', () => {
  // Save original console log/error functions
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const mockCwd = '/test/project';

  beforeEach(() => {
    // Mock console.log and console.error
    console.log = jest.fn();
    console.error = jest.fn();

    // Mock process.cwd()
    process.cwd = jest.fn().mockReturnValue(mockCwd);

    // Mock path functions
    path.join.mockImplementation((...args) => args.join('/'));
    path.resolve.mockImplementation(p => p);

    // Mock fs functions
    fs.existsSync.mockReset();
    fs.mkdirSync.mockReset();
    fs.writeFileSync.mockReset();

    // Mock utility functions
    updatePackageJson.mockReset();
    createConfigFile.mockReset();
  });

  afterEach(() => {
    // Restore console functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    jest.resetAllMocks();
  });

  test('should create necessary directories and config files', () => {
    // Mock fs.existsSync to return false for all paths (directories don't exist)
    fs.existsSync.mockReturnValue(false);

    // Run the init command
    init();

    // Check that directories were created
    expect(fs.mkdirSync).toHaveBeenCalledWith(`${mockCwd}/.mcptix`, { recursive: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith(`${mockCwd}/.mcptix/data`, { recursive: true });

    // Check that db-config.json was created with the correct path
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      `${mockCwd}/.mcptix/db-config.json`,
      expect.stringContaining('dbPath'),
    );

    // Check that configuration files were created
    expect(createConfigFile).toHaveBeenCalled();

    // Check that package.json was updated
    expect(updatePackageJson).toHaveBeenCalled();
  });

  test('should skip directory creation if they already exist', () => {
    // Mock fs.existsSync to return true for directories
    fs.existsSync.mockImplementation(p => {
      return p === `${mockCwd}/.mcptix` || p === `${mockCwd}/.mcptix/data`;
    });

    // Run the init command
    init();

    // Check that directories were not created
    expect(fs.mkdirSync).not.toHaveBeenCalledWith(`${mockCwd}/.mcptix`, { recursive: true });
    expect(fs.mkdirSync).not.toHaveBeenCalledWith(`${mockCwd}/.mcptix/data`, { recursive: true });

    // Check that other functions were still called
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(createConfigFile).toHaveBeenCalled();
    expect(updatePackageJson).toHaveBeenCalled();
  });

  test('should handle errors gracefully', () => {
    // Mock fs.mkdirSync to throw an error
    fs.mkdirSync.mockImplementation(() => {
      throw new Error('Permission denied');
    });

    // Mock process.exit to prevent test from exiting
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Run the init command
    init();

    // Check that error was logged and process.exit was called
    expect(console.error).toHaveBeenCalledWith('Error initializing McpTix:', 'Permission denied');
    expect(mockExit).toHaveBeenCalledWith(1);

    // Restore process.exit
    mockExit.mockRestore();
  });

  test('should create database config with the correct path', () => {
    // Mock fs.existsSync to return false (directories don't exist)
    fs.existsSync.mockReturnValue(false);

    // Run the init command
    init();

    // Check that db-config.json was created with the correct database path
    const expectedDbPath = `${mockCwd}/.mcptix/data/mcptix.db`;

    // Find the call to writeFileSync for db-config.json
    const dbConfigCall = fs.writeFileSync.mock.calls.find(
      call => call[0] === `${mockCwd}/.mcptix/db-config.json`,
    );

    expect(dbConfigCall).toBeDefined();

    // Parse the JSON content to check the dbPath
    const dbConfig = JSON.parse(dbConfigCall[1]);
    expect(dbConfig).toHaveProperty('dbPath');
    expect(dbConfig.dbPath).toContain('mcptix.db');
  });
});
