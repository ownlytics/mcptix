# Changelog

All notable changes to mcptix will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.15] - 2025-04-07 [BETA]

### Fixed

- Resolved JSON parsing errors in Claude Desktop and other MCP clients by removing all stdio/stdout logging from the MCP server
- Fixed `Expected ',' or ']' after array element in JSON at position 5` errors in Claude Desktop logs
- Eliminated interference between logging and MCP protocol communication

### Changed

- Redirected all logging to dedicated log files instead of stdout/stderr
- Refactored JSON serialization to ensure strict adherence to MCP protocol specifications
- Improved portability to work seamlessly with multiple MCP clients

## [0.1.0] - 2025-04-03 [BETA]

### Added

- Initial release of mcptix
- Kanban board UI for ticket management
- Ticket creation, editing, and deletion
- Comment system for tickets
- Complexity Intelligence Engine for tracking ticket complexity
- MCP server for AI assistant integration
- RESTful API for programmatic access
- CLI tool for easy setup and usage
- Configuration system for customization
