"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const middleware_1 = require("./middleware");
const validation_1 = require("./validation");
/**
 * Sets up all API routes
 * @param app The Express application
 * @param ticketQueries The TicketQueries instance
 */
function setupRoutes(app, ticketQueries) {
    // Get all tickets with optional filtering
    app.get('/api/tickets', (req, res, next) => {
        try {
            const filters = {
                status: req.query.status,
                priority: req.query.priority,
                search: req.query.search,
            };
            const sort = req.query.sort || 'order_value';
            const order = req.query.order || 'desc';
            const limit = parseInt(req.query.limit || '100', 10);
            const offset = parseInt(req.query.offset || '0', 10);
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
        }
        catch (error) {
            next(error);
        }
    });
    // Get a ticket by ID
    app.get('/api/tickets/:id', (req, res, next) => {
        try {
            const ticket = ticketQueries.getTicketById(req.params.id);
            if (!ticket) {
                res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
                return;
            }
            res.json(ticket);
        }
        catch (error) {
            next(error);
        }
    });
    // Create a new ticket
    app.post('/api/tickets', (0, middleware_1.validateRequest)(validation_1.validateCreateTicket), (req, res, next) => {
        try {
            const { title, description, priority, status, complexity_metadata, agent_context } = req.body;
            const ticket = {
                id: `ticket-${Date.now()}`,
                title,
                description: description || '',
                priority: priority || 'medium',
                status: status || 'backlog',
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                agent_context: agent_context || null,
            };
            if (complexity_metadata) {
                ticket.complexity_metadata = {
                    ticket_id: ticket.id,
                    ...complexity_metadata,
                };
            }
            const ticketId = ticketQueries.createTicket(ticket);
            // Get the created ticket with the server-calculated CIE score
            // const createdTicket = ticketQueries.getTicketById(ticketId);
            res.status(201).json({ id: ticketId, success: true });
        }
        catch (error) {
            next(error);
        }
    });
    // Update an existing ticket
    app.put('/api/tickets/:id', (0, middleware_1.validateRequest)(validation_1.validateUpdateTicket), (req, res, next) => {
        try {
            const { title, description, priority, status, complexity_metadata, agent_context } = req.body;
            // Check if ticket exists
            const existingTicket = ticketQueries.getTicketById(req.params.id);
            if (!existingTicket) {
                res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
                return;
            }
            // Create updated ticket object
            const ticket = {
                id: req.params.id,
                title: title !== undefined ? title : existingTicket.title,
                description: description !== undefined ? description : existingTicket.description,
                priority: priority !== undefined ? priority : existingTicket.priority,
                status: status !== undefined ? status : existingTicket.status,
                created: existingTicket.created,
                updated: new Date().toISOString(),
                agent_context: agent_context !== undefined ? agent_context : existingTicket.agent_context,
            };
            // Update complexity metadata if provided
            if (complexity_metadata) {
                ticket.complexity_metadata = {
                    ticket_id: req.params.id,
                    ...existingTicket.complexity_metadata,
                    ...complexity_metadata,
                };
            }
            else if (existingTicket.complexity_metadata) {
                ticket.complexity_metadata = existingTicket.complexity_metadata;
            }
            // Update ticket
            const success = ticketQueries.updateTicket(ticket);
            // Get the updated ticket with the server-calculated CIE score
            const updatedTicket = ticketQueries.getTicketById(req.params.id);
            res.json(updatedTicket || { id: req.params.id, success });
        }
        catch (error) {
            next(error);
        }
    });
    // Delete a ticket
    app.delete('/api/tickets/:id', (req, res, next) => {
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
        }
        catch (error) {
            next(error);
        }
    });
    // Get comments for a ticket
    app.get('/api/tickets/:id/comments', (req, res, next) => {
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
        }
        catch (error) {
            next(error);
        }
    });
    // Add a comment to a ticket
    app.post('/api/tickets/:id/comments', (0, middleware_1.validateRequest)(validation_1.validateCreateComment), (req, res, next) => {
        try {
            const { content, author } = req.body;
            // Check if ticket exists
            const existingTicket = ticketQueries.getTicketById(req.params.id);
            if (!existingTicket) {
                res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
                return;
            }
            // Create comment object
            const comment = {
                id: `comment-${Date.now()}`,
                ticket_id: req.params.id,
                content,
                author: author || 'developer',
                timestamp: new Date().toISOString(),
            };
            // Add comment
            const commentId = ticketQueries.addComment(req.params.id, comment);
            res.status(201).json({ id: commentId, success: true });
        }
        catch (error) {
            next(error);
        }
    });
    // Search for tickets
    app.get('/api/search', (0, middleware_1.validateRequest)(validation_1.validateSearch), (req, res, next) => {
        try {
            const query = req.query.q;
            const filters = {
                status: req.query.status,
                priority: req.query.priority,
                search: query,
            };
            const sort = req.query.sort || 'order_value';
            const order = req.query.order || 'desc';
            const limit = parseInt(req.query.limit || '100', 10);
            const offset = parseInt(req.query.offset || '0', 10);
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
        }
        catch (error) {
            next(error);
        }
    });
    // Export all data to JSON format
    app.get('/api/export', (req, res, next) => {
        try {
            const data = ticketQueries.exportToJson();
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    });
    // Get the next ticket from a status category
    app.get('/api/tickets/next/:status', (req, res, next) => {
        try {
            const status = req.params.status;
            const ticket = ticketQueries.getNextTicket(status);
            if (!ticket) {
                res.status(404).json({ error: `No tickets found in ${status}` });
                return;
            }
            res.json(ticket);
        }
        catch (error) {
            next(error);
        }
    });
    // Reorder a ticket within its status column
    app.put('/api/tickets/:id/reorder', (req, res, next) => {
        try {
            const { order_value } = req.body;
            if (typeof order_value !== 'number') {
                res.status(400).json({ error: 'order_value must be a number' });
                return;
            }
            const success = ticketQueries.reorderTicket(req.params.id, order_value);
            if (!success) {
                res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
                return;
            }
            res.json({ id: req.params.id, success });
        }
        catch (error) {
            next(error);
        }
    });
    // Move a ticket to a different status
    app.put('/api/tickets/:id/move', (req, res, next) => {
        try {
            const { status, order_value } = req.body;
            if (!status || !['backlog', 'up-next', 'in-progress', 'in-review', 'completed'].includes(status)) {
                res.status(400).json({
                    error: 'status must be one of: backlog, up-next, in-progress, in-review, completed',
                });
                return;
            }
            const success = ticketQueries.moveTicket(req.params.id, status, order_value);
            if (!success) {
                res.status(404).json({ error: `Ticket with ID ${req.params.id} not found` });
                return;
            }
            res.json({ id: req.params.id, success });
        }
        catch (error) {
            next(error);
        }
    });
}
//# sourceMappingURL=routes.js.map