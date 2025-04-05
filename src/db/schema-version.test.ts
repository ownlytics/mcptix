import { CURRENT_SCHEMA_VERSION } from './schema';

describe('Schema Version', () => {
  test('should match the latest migration version', () => {
    // This test ensures that CURRENT_SCHEMA_VERSION is updated when new migrations are added
    expect(CURRENT_SCHEMA_VERSION).toBe(3);
  });
});
