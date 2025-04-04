/**
 * Constants module for mcptix
 * Defines enumerations and constants used throughout the application
 */

// Ticket priorities
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

// Ticket statuses
export const STATUSES = {
  BACKLOG: 'backlog',
  UP_NEXT: 'up-next',
  IN_PROGRESS: 'in-progress',
  IN_REVIEW: 'in-review',
  COMPLETED: 'completed',
};

// Comment types
export const COMMENT_TYPES = {
  COMMENT: 'comment',
  REQUEST_CHANGES: 'request_changes',
  CHANGE_PROPOSAL: 'change_proposal',
};

// Comment statuses
export const COMMENT_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  WONT_FIX: 'wont_fix',
};

// Comment authors
export const COMMENT_AUTHORS = {
  DEVELOPER: 'developer',
  AGENT: 'agent',
};

// Complexity levels
export const COMPLEXITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

// Complexity thresholds
export const COMPLEXITY_THRESHOLDS = {
  MEDIUM: 40,
  HIGH: 70,
};

// Local storage keys
export const STORAGE_KEYS = {
  TICKETS: 'mcptix-tickets',
  TICKETS_BACKUP: 'mcptix-tickets-backup',
};

// API endpoints
export const API_ENDPOINTS = {
  TICKETS: '/api/tickets',
  TICKET: id => `/api/tickets/${id}`,
  COMMENTS: ticketId => `/api/tickets/${ticketId}/comments`,
  SEARCH: '/api/search',
  EXPORT: '/api/export',
};
