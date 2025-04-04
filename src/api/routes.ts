import express, { Request, Response, NextFunction } from 'express';

import { TicketQueries } from '../db/queries';
import { Ticket, Comment } from '../types';

import { validateRequest } from './middleware';
import {
  validateCreateTicket,
  validateUpdateTicket,
  validateCreateComment,
  validateSearch,
} from './validation';

/**
 * Sets up all API routes
 * @param app The Express application
 * @param ticketQueries The TicketQueries instance
 */
export function setupRoutes(app: express.Application, ticketQueries: TicketQueries): void {
  // Get all tickets with optional filtering
  app.get('/api/tickets', (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        search: req.query.search as string,
      };

      const sort = (req.query.sort as string) || 'updated';
      const order = (req.query.order as string) || 'desc';
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);

      const tickets = ticketQueries.getTickets(filters, sort, order, limit, offset);

      res.json({
        tickets,
        metadata: {
          total: tickets.length,
          limit,
          offset,
          sort,
          order,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Get a ticket by ID
  app.get('/api/tickets/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = ticketQueries.getTicketById(req.params.id);

      if (!ticket) {
        res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
        return;
      }

      res.json(ticket);
    } catch (error) {
      next(error);
    }
  });

  // Create a new ticket
  app.post(
    '/api/tickets',
    validateRequest(validateCreateTicket),
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const { title, description, priority, status, complexity_metadata } = req.body;

        const ticket: Ticket = {
          id: `ticket-${Date.now()}`,
          title,
          description: description || '',
          priority: priority || 'medium',
          status: status || 'backlog',
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        };

        if (complexity_metadata) {
          ticket.complexity_metadata = {
            ticket_id: ticket.id,
            ...complexity_metadata,
          };
        }
        const ticketId = ticketQueries.createTicket(ticket);

        // Get the created ticket with the server-calculated CIE score
        const createdTicket = ticketQueries.getTicketById(ticketId);

        res.status(201).json(createdTicket || { id: ticketId, success: true });
        res.status(201).json({ id: ticketId, success: true });
      } catch (error) {
        next(error);
      }
    },
  );

  // Update an existing ticket
  app.put(
    '/api/tickets/:id',
    validateRequest(validateUpdateTicket),
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const { title, description, priority, status, complexity_metadata } = req.body;

        // Check if ticket exists
        const existingTicket = ticketQueries.getTicketById(req.params.id);
        if (!existingTicket) {
          res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
          return;
        }

        // Create updated ticket object
        const ticket: Ticket = {
          id: req.params.id,
          title: title !== undefined ? title : existingTicket.title,
          description: description !== undefined ? description : existingTicket.description,
          priority: priority !== undefined ? priority : existingTicket.priority,
          status: status !== undefined ? status : existingTicket.status,
          created: existingTicket.created,
          updated: new Date().toISOString(),
        };

        // Update complexity metadata if provided
        if (complexity_metadata) {
          ticket.complexity_metadata = {
            ticket_id: req.params.id,
            ...existingTicket.complexity_metadata,
            ...complexity_metadata,
          };
        } else if (existingTicket.complexity_metadata) {
          ticket.complexity_metadata = existingTicket.complexity_metadata;
        }

        // Update ticket
        const success = ticketQueries.updateTicket(ticket);

        // Get the updated ticket with the server-calculated CIE score
        const updatedTicket = ticketQueries.getTicketById(req.params.id);

        res.json(updatedTicket || { id: req.params.id, success });
      } catch (error) {
        next(error);
      }
    },
  );

  // Delete a ticket
  app.delete('/api/tickets/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if ticket exists
      const existingTicket = ticketQueries.getTicketById(req.params.id);
      if (!existingTicket) {
        res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
        return;
      }

      // Delete ticket
      const success = ticketQueries.deleteTicket(req.params.id);

      res.json({ id: req.params.id, success });
    } catch (error) {
      next(error);
    }
  });

  // Get comments for a ticket
  app.get('/api/tickets/:id/comments', (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if ticket exists
      const existingTicket = ticketQueries.getTicketById(req.params.id);
      if (!existingTicket) {
        res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
        return;
      }

      // Get comments
      const comments = existingTicket.comments || [];

      res.json({ comments });
    } catch (error) {
      next(error);
    }
  });

  // Add a comment to a ticket
  app.post(
    '/api/tickets/:id/comments',
    validateRequest(validateCreateComment),
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const { content, type, author, status } = req.body;

        // Check if ticket exists
        const existingTicket = ticketQueries.getTicketById(req.params.id);
        if (!existingTicket) {
          res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
          return;
        }

        // Create comment object
        const comment: Comment = {
          id: `comment-${Date.now()}`,
          ticket_id: req.params.id,
          content,
          type: type || 'comment',
          author: author || 'developer',
          status: status || 'open',
          timestamp: new Date().toISOString(),
        };

        // Add comment
        const commentId = ticketQueries.addComment(req.params.id, comment);

        res.status(201).json({ id: commentId, success: true });
      } catch (error) {
        next(error);
      }
    },
  );

  // Search for tickets
  app.get(
    '/api/search',
    validateRequest(validateSearch),
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.query.q as string;

        const filters = {
          status: req.query.status as string,
          priority: req.query.priority as string,
          search: query,
        };

        const sort = (req.query.sort as string) || 'updated';
        const order = (req.query.order as string) || 'desc';
        const limit = parseInt((req.query.limit as string) || '100', 10);
        const offset = parseInt((req.query.offset as string) || '0', 10);

        const tickets = ticketQueries.getTickets(filters, sort, order, limit, offset);

        res.json({
          tickets,
          metadata: {
            query,
            total: tickets.length,
            limit,
            offset,
            sort,
            order,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Export all data to JSON format
  app.get('/api/export', (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = ticketQueries.exportToJson();

      res.json(data);
    } catch (error) {
      next(error);
    }
  });
}
