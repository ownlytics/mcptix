# Jest Test Error Parser

A powerful tool for parsing Jest test errors and formatting them for easier debugging, especially with LLMs.

## Features

- Runs Jest tests and captures all errors
- Parses and deduplicates errors to avoid redundancy
- Groups errors by file for better organization
- Categorizes errors by type (SQLite errors, test structure issues, etc.)
- Extracts the most relevant information for each error
- Supports filtering errors by type
- Outputs errors as JSON for programmatic use
- Saves results to a file for later analysis

## Usage via npm scripts

For convenience, several npm scripts have been added to package.json:

```bash
# Basic usage - run tests and show parsed errors
npm run test:errors

# Save errors as JSON to a file
npm run test:errors:json

# Filter errors by a specific type
npm run test:errors:filter "SQLite"

# Output JSON format for LLM consumption
# (strips extra output lines for cleaner input to AI)
npm run test:errors:ai
```

## Direct script usage

You can also run the script directly with additional options:

```bash
# Show help
node scripts/parse-test-errors.js --help

# Run specific test files and parse errors
node scripts/parse-test-errors.js "npm test src/api"

# Filter errors by type and save as JSON
node scripts/parse-test-errors.js --filter "readonly database" --json --output db-errors.json
```

## Command Line Options

- `--help`, `-h`: Show help message
- `--json`, `-j`: Output results in JSON format
- `--output FILE`, `-o FILE`: Save results to the specified file
- `--filter TYPE`, `-f TYPE`: Filter results by error type (e.g., "SQLite", "Test Structure")

## Examples for Effective LLM Debugging

For the most effective debugging with LLMs, consider these workflows:

1. **General error overview**:

   ```bash
   npm run test:errors
   ```

2. **Focus on specific error types**:

   ```bash
   npm run test:errors:filter "readonly database"
   ```

3. **Feed structured error data directly to an LLM**:

   ```bash
   npm run test:errors:ai
   ```

4. **Save errors for later analysis**:

   ```bash
   npm run test:errors:json
   # Later, examine with: cat errors.json
   ```

5. **Combine with specific test runs**:
   ```bash
   node scripts/parse-test-errors.js "npm test src/api" --filter "SQLite" --json
   ```
