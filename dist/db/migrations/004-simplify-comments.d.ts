import { Migration } from './index';
/**
 * Migration 4: Simplify Comments Table
 *
 * This migration:
 * 1. Consolidates content/summary/full_text into a single content field
 * 2. Removes unused columns (type, status, summary, full_text, display)
 */
declare const migration: Migration;
export default migration;
//# sourceMappingURL=004-simplify-comments.d.ts.map