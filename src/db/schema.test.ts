import fs from 'fs';
import path from 'path';
import { initializeDatabase, closeDatabase } from './schema';

describe('Database Schema', () => {
  const testDbPath = path.join(process.cwd(), 'test.db');
  
  // Clean up test database before and after tests
  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  test('should create database with required tables', () => {
    const db = initializeDatabase(testDbPath);
    
    // Check if tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('tickets', 'complexity', 'comments')
    `).all();
    
    expect(tables.length).toBe(3);
    
    // Check if indexes exist
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' 
      AND name IN (
        'idx_tickets_status', 
        'idx_tickets_priority', 
        'idx_comments_ticket_id', 
        'idx_complexity_cie_score'
      )
    `).all();
    
    expect(indexes.length).toBe(4);
    
    closeDatabase(db);
  });
  
  test('should enforce foreign key constraints', () => {
    const db = initializeDatabase(testDbPath);
    
    // Insert a ticket
    db.prepare(`
      INSERT INTO tickets (id, title, priority, status, created, updated)
      VALUES ('test-ticket', 'Test Ticket', 'medium', 'backlog', '2023-01-01', '2023-01-01')
    `).run();
    
    // Insert a comment with valid ticket_id
    const validInsert = () => {
      db.prepare(`
        INSERT INTO comments (id, ticket_id, type, author, status, timestamp)
        VALUES ('test-comment', 'test-ticket', 'comment', 'developer', 'open', '2023-01-01')
      `).run();
    };
    
    expect(validInsert).not.toThrow();
    
    // Try to insert a comment with invalid ticket_id
    const invalidInsert = () => {
      db.prepare(`
        INSERT INTO comments (id, ticket_id, type, author, status, timestamp)
        VALUES ('test-comment-2', 'non-existent-ticket', 'comment', 'developer', 'open', '2023-01-01')
      `).run();
    };
    
    expect(invalidInsert).toThrow();
    
    closeDatabase(db);
  });
});