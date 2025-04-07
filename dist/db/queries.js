"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketQueries = void 0;
const complexityCalculator_1 = require("../utils/complexityCalculator");
class TicketQueries {
    constructor(db) {
        this.db = db;
    }
    // Get all tickets with optional filtering
    getTickets(filters = {}, sort = 'updated', order = 'desc', limit = 100, offset = 0) {
        // Build WHERE clause from filters
        const whereConditions = [];
        const params = {};
        if (filters.status) {
            whereConditions.push('status = :status');
            params.status = filters.status;
        }
        if (filters.priority) {
            whereConditions.push('priority = :priority');
            params.priority = filters.priority;
        }
        if (filters.search) {
            whereConditions.push('(title LIKE :search OR description LIKE :search)');
            params.search = `%${filters.search}%`;
        }
        // Build query
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const query = `
      SELECT t.*
      FROM tickets t
      ${whereClause}
      ORDER BY ${sort} ${order}
      LIMIT :limit OFFSET :offset
    `;
        // Execute query
        const stmt = this.db.prepare(query);
        const tickets = stmt.all({ ...params, limit, offset });
        // For each ticket, get its full complexity metadata
        for (const ticket of tickets) {
            const complexityStmt = this.db.prepare('SELECT * FROM complexity WHERE ticket_id = ?');
            const complexityData = complexityStmt.get(ticket.id);
            // Ensure all complexity fields are properly initialized
            if (complexityData) {
                ticket.complexity_metadata = {
                    ticket_id: ticket.id,
                    files_touched: complexityData.files_touched || 0,
                    modules_crossed: complexityData.modules_crossed || 0,
                    stack_layers_involved: complexityData.stack_layers_involved || 0,
                    dependencies: complexityData.dependencies || 0,
                    shared_state_touches: complexityData.shared_state_touches || 0,
                    cascade_impact_zones: complexityData.cascade_impact_zones || 0,
                    subjectivity_rating: complexityData.subjectivity_rating || 0,
                    loc_added: complexityData.loc_added || 0,
                    loc_modified: complexityData.loc_modified || 0,
                    test_cases_written: complexityData.test_cases_written || 0,
                    edge_cases: complexityData.edge_cases || 0,
                    mocking_complexity: complexityData.mocking_complexity || 0,
                    coordination_touchpoints: complexityData.coordination_touchpoints || 0,
                    review_rounds: complexityData.review_rounds || 0,
                    blockers_encountered: complexityData.blockers_encountered || 0,
                    cie_score: complexityData.cie_score || 0,
                };
            }
            else {
                // Initialize with default values if no complexity data exists
                ticket.complexity_metadata = {
                    ticket_id: ticket.id,
                    files_touched: 0,
                    modules_crossed: 0,
                    stack_layers_involved: 0,
                    dependencies: 0,
                    shared_state_touches: 0,
                    cascade_impact_zones: 0,
                    subjectivity_rating: 0,
                    loc_added: 0,
                    loc_modified: 0,
                    test_cases_written: 0,
                    edge_cases: 0,
                    mocking_complexity: 0,
                    coordination_touchpoints: 0,
                    review_rounds: 0,
                    blockers_encountered: 0,
                    cie_score: 0,
                };
            }
        }
        return tickets;
    }
    // Get ticket by ID with comments and complexity
    getTicketById(id) {
        const ticketStmt = this.db.prepare('SELECT * FROM tickets WHERE id = ?');
        const ticket = ticketStmt.get(id);
        if (!ticket)
            return null;
        // Get comments
        const commentsStmt = this.db.prepare('SELECT * FROM comments WHERE ticket_id = ? ORDER BY timestamp');
        ticket.comments = commentsStmt.all(id);
        // Get complexity metadata
        const complexityStmt = this.db.prepare('SELECT * FROM complexity WHERE ticket_id = ?');
        const complexityData = complexityStmt.get(id);
        // Ensure all complexity fields are properly initialized
        if (complexityData) {
            ticket.complexity_metadata = {
                ticket_id: id,
                files_touched: complexityData.files_touched || 0,
                modules_crossed: complexityData.modules_crossed || 0,
                stack_layers_involved: complexityData.stack_layers_involved || 0,
                dependencies: complexityData.dependencies || 0,
                shared_state_touches: complexityData.shared_state_touches || 0,
                cascade_impact_zones: complexityData.cascade_impact_zones || 0,
                subjectivity_rating: complexityData.subjectivity_rating || 0,
                loc_added: complexityData.loc_added || 0,
                loc_modified: complexityData.loc_modified || 0,
                test_cases_written: complexityData.test_cases_written || 0,
                edge_cases: complexityData.edge_cases || 0,
                mocking_complexity: complexityData.mocking_complexity || 0,
                coordination_touchpoints: complexityData.coordination_touchpoints || 0,
                review_rounds: complexityData.review_rounds || 0,
                blockers_encountered: complexityData.blockers_encountered || 0,
                cie_score: complexityData.cie_score || 0,
            };
        }
        else {
            // Initialize with default values if no complexity data exists
            ticket.complexity_metadata = {
                ticket_id: id,
                files_touched: 0,
                modules_crossed: 0,
                stack_layers_involved: 0,
                dependencies: 0,
                shared_state_touches: 0,
                cascade_impact_zones: 0,
                subjectivity_rating: 0,
                loc_added: 0,
                loc_modified: 0,
                test_cases_written: 0,
                edge_cases: 0,
                mocking_complexity: 0,
                coordination_touchpoints: 0,
                review_rounds: 0,
                blockers_encountered: 0,
                cie_score: 0,
            };
        }
        return ticket;
    }
    // Create a new ticket
    createTicket(ticket) {
        const now = new Date().toISOString();
        const ticketId = ticket.id || `ticket-${Date.now()}`;
        // Start transaction
        const transaction = this.db.transaction(() => {
            // Insert ticket
            const ticketStmt = this.db.prepare(`
        INSERT INTO tickets (id, title, description, priority, status, created, updated, agent_context)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
            ticketStmt.run(ticketId, ticket.title, ticket.description || '', ticket.priority || 'medium', ticket.status || 'backlog', now, now, ticket.agent_context || null);
            // Insert complexity if provided
            if (ticket.complexity_metadata) {
                // Extract complexity metrics
                const complexityMetrics = {
                    files_touched: ticket.complexity_metadata.files_touched || 0,
                    modules_crossed: ticket.complexity_metadata.modules_crossed || 0,
                    stack_layers_involved: ticket.complexity_metadata.stack_layers_involved || 0,
                    dependencies: ticket.complexity_metadata.dependencies || 0,
                    shared_state_touches: ticket.complexity_metadata.shared_state_touches || 0,
                    cascade_impact_zones: ticket.complexity_metadata.cascade_impact_zones || 0,
                    subjectivity_rating: ticket.complexity_metadata.subjectivity_rating || 0,
                    loc_added: ticket.complexity_metadata.loc_added || 0,
                    loc_modified: ticket.complexity_metadata.loc_modified || 0,
                    test_cases_written: ticket.complexity_metadata.test_cases_written || 0,
                    edge_cases: ticket.complexity_metadata.edge_cases || 0,
                    mocking_complexity: ticket.complexity_metadata.mocking_complexity || 0,
                    coordination_touchpoints: ticket.complexity_metadata.coordination_touchpoints || 0,
                    review_rounds: ticket.complexity_metadata.review_rounds || 0,
                    blockers_encountered: ticket.complexity_metadata.blockers_encountered || 0,
                };
                // Use the provided CIE score if it exists, otherwise calculate it
                const cieScore = ticket.complexity_metadata.cie_score !== undefined
                    ? ticket.complexity_metadata.cie_score
                    : (0, complexityCalculator_1.calculateComplexityScore)(complexityMetrics);
                const complexityStmt = this.db.prepare(`
          INSERT INTO complexity (
            ticket_id, files_touched, modules_crossed, stack_layers_involved,
            dependencies, shared_state_touches, cascade_impact_zones,
            subjectivity_rating, loc_added, loc_modified,
            test_cases_written, edge_cases, mocking_complexity,
            coordination_touchpoints, review_rounds, blockers_encountered,
            cie_score
          ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?
          )
        `);
                complexityStmt.run(ticketId, complexityMetrics.files_touched, complexityMetrics.modules_crossed, complexityMetrics.stack_layers_involved, complexityMetrics.dependencies, complexityMetrics.shared_state_touches, complexityMetrics.cascade_impact_zones, complexityMetrics.subjectivity_rating, complexityMetrics.loc_added, complexityMetrics.loc_modified, complexityMetrics.test_cases_written, complexityMetrics.edge_cases, complexityMetrics.mocking_complexity, complexityMetrics.coordination_touchpoints, complexityMetrics.review_rounds, complexityMetrics.blockers_encountered, cieScore);
            }
            // Insert comments if provided
            if (ticket.comments && ticket.comments.length > 0) {
                const commentStmt = this.db.prepare(`
          INSERT INTO comments (
            id, ticket_id, content, type, author, status, timestamp,
            summary, full_text, display
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?
          )
        `);
                for (const comment of ticket.comments) {
                    commentStmt.run(comment.id || `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`, ticketId, comment.content || '', comment.type || 'comment', comment.author || 'developer', comment.status || 'open', comment.timestamp || now, comment.summary || null, comment.fullText || null, comment.display || 'collapsed');
                }
            }
            return ticketId;
        });
        // Execute transaction
        return transaction();
    }
    // Update an existing ticket
    updateTicket(ticket) {
        const now = new Date().toISOString();
        // Start transaction
        const transaction = this.db.transaction(() => {
            // Update ticket
            const ticketStmt = this.db.prepare(`
        UPDATE tickets
        SET title = ?,
            description = ?,
            priority = ?,
            status = ?,
            updated = ?,
            agent_context = ?
        WHERE id = ?
      `);
            const result = ticketStmt.run(ticket.title, ticket.description || '', ticket.priority || 'medium', ticket.status || 'backlog', now, ticket.agent_context || null, ticket.id);
            if (result.changes === 0)
                return false;
            // Update complexity if provided
            if (ticket.complexity_metadata) {
                // Extract complexity metrics
                const complexityMetrics = {
                    files_touched: ticket.complexity_metadata.files_touched || 0,
                    modules_crossed: ticket.complexity_metadata.modules_crossed || 0,
                    stack_layers_involved: ticket.complexity_metadata.stack_layers_involved || 0,
                    dependencies: ticket.complexity_metadata.dependencies || 0,
                    shared_state_touches: ticket.complexity_metadata.shared_state_touches || 0,
                    cascade_impact_zones: ticket.complexity_metadata.cascade_impact_zones || 0,
                    subjectivity_rating: ticket.complexity_metadata.subjectivity_rating || 0,
                    loc_added: ticket.complexity_metadata.loc_added || 0,
                    loc_modified: ticket.complexity_metadata.loc_modified || 0,
                    test_cases_written: ticket.complexity_metadata.test_cases_written || 0,
                    edge_cases: ticket.complexity_metadata.edge_cases || 0,
                    mocking_complexity: ticket.complexity_metadata.mocking_complexity || 0,
                    coordination_touchpoints: ticket.complexity_metadata.coordination_touchpoints || 0,
                    review_rounds: ticket.complexity_metadata.review_rounds || 0,
                    blockers_encountered: ticket.complexity_metadata.blockers_encountered || 0,
                };
                // Calculate the CIE score on the server side
                const cieScore = (0, complexityCalculator_1.calculateComplexityScore)(complexityMetrics);
                const complexityStmt = this.db.prepare(`
          INSERT OR REPLACE INTO complexity (
            ticket_id, files_touched, modules_crossed, stack_layers_involved,
            dependencies, shared_state_touches, cascade_impact_zones,
            subjectivity_rating, loc_added, loc_modified,
            test_cases_written, edge_cases, mocking_complexity,
            coordination_touchpoints, review_rounds, blockers_encountered,
            cie_score
          ) VALUES (
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?
          )
        `);
                complexityStmt.run(ticket.id, complexityMetrics.files_touched, complexityMetrics.modules_crossed, complexityMetrics.stack_layers_involved, complexityMetrics.dependencies, complexityMetrics.shared_state_touches, complexityMetrics.cascade_impact_zones, complexityMetrics.subjectivity_rating, complexityMetrics.loc_added, complexityMetrics.loc_modified, complexityMetrics.test_cases_written, complexityMetrics.edge_cases, complexityMetrics.mocking_complexity, complexityMetrics.coordination_touchpoints, complexityMetrics.review_rounds, complexityMetrics.blockers_encountered, cieScore);
            }
            return true;
        });
        // Execute transaction
        return transaction();
    }
    // Delete a ticket
    deleteTicket(id) {
        const stmt = this.db.prepare('DELETE FROM tickets WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // Add a comment to a ticket
    addComment(ticketId, comment) {
        const now = new Date().toISOString();
        const commentId = comment.id || `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const stmt = this.db.prepare(`
      INSERT INTO comments (
        id, ticket_id, content, type, author, status, timestamp,
        summary, full_text, display
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )
    `);
        stmt.run(commentId, ticketId, comment.content || '', comment.type || 'comment', comment.author || 'developer', comment.status || 'open', comment.timestamp || now, comment.summary || null, comment.fullText || null, comment.display || 'collapsed');
        // Update ticket's updated timestamp
        this.db.prepare('UPDATE tickets SET updated = ? WHERE id = ?').run(now, ticketId);
        return commentId;
    }
    // Export all data to JSON format (for Git compatibility)
    exportToJson() {
        const columns = [
            { id: 'backlog', name: 'Backlog', tickets: [] },
            { id: 'up-next', name: 'Up Next', tickets: [] },
            { id: 'in-progress', name: 'In Progress', tickets: [] },
            { id: 'in-review', name: 'In Review', tickets: [] },
            { id: 'completed', name: 'Completed', tickets: [] },
        ];
        // Get all tickets with their complexity and comments
        const ticketsStmt = this.db.prepare(`
      SELECT t.*
      FROM tickets t
      ORDER BY t.updated DESC
    `);
        const tickets = ticketsStmt.all();
        // Get complexity for each ticket
        const complexityStmt = this.db.prepare('SELECT * FROM complexity WHERE ticket_id = ?');
        // Get comments for each ticket
        const commentsStmt = this.db.prepare('SELECT * FROM comments WHERE ticket_id = ? ORDER BY timestamp');
        // Organize tickets by column
        for (const ticket of tickets) {
            // Add complexity metadata
            const complexityData = complexityStmt.get(ticket.id);
            // Ensure all complexity fields are properly initialized
            if (complexityData) {
                ticket.complexity_metadata = {
                    ticket_id: ticket.id,
                    files_touched: complexityData.files_touched || 0,
                    modules_crossed: complexityData.modules_crossed || 0,
                    stack_layers_involved: complexityData.stack_layers_involved || 0,
                    dependencies: complexityData.dependencies || 0,
                    shared_state_touches: complexityData.shared_state_touches || 0,
                    cascade_impact_zones: complexityData.cascade_impact_zones || 0,
                    subjectivity_rating: complexityData.subjectivity_rating || 0,
                    loc_added: complexityData.loc_added || 0,
                    loc_modified: complexityData.loc_modified || 0,
                    test_cases_written: complexityData.test_cases_written || 0,
                    edge_cases: complexityData.edge_cases || 0,
                    mocking_complexity: complexityData.mocking_complexity || 0,
                    coordination_touchpoints: complexityData.coordination_touchpoints || 0,
                    review_rounds: complexityData.review_rounds || 0,
                    blockers_encountered: complexityData.blockers_encountered || 0,
                    cie_score: complexityData.cie_score || 0,
                };
            }
            else {
                // Initialize with default values if no complexity data exists
                ticket.complexity_metadata = {
                    ticket_id: ticket.id,
                    files_touched: 0,
                    modules_crossed: 0,
                    stack_layers_involved: 0,
                    dependencies: 0,
                    shared_state_touches: 0,
                    cascade_impact_zones: 0,
                    subjectivity_rating: 0,
                    loc_added: 0,
                    loc_modified: 0,
                    test_cases_written: 0,
                    edge_cases: 0,
                    mocking_complexity: 0,
                    coordination_touchpoints: 0,
                    review_rounds: 0,
                    blockers_encountered: 0,
                    cie_score: 0,
                };
            }
            // Add comments
            ticket.comments = commentsStmt.all(ticket.id);
            // Add to appropriate column
            const column = columns.find(col => col.id === ticket.status);
            if (column) {
                column.tickets.push(ticket);
            }
        }
        return { columns };
    }
    /**
     * Get the "next" ticket from a status category
     * Returns the ticket with the highest order_value in the specified status
     * In case of ties, the most recently updated ticket is returned
     * @param status The status category to get the next ticket from
     * @returns The next ticket, or null if no tickets exist in the status
     */
    getNextTicket(status) {
        // Get the ticket with the highest order_value in the specified status
        // If there are multiple tickets with the same order_value, get the most recently updated one
        const stmt = this.db.prepare(`
  SELECT t.*
  FROM tickets t
  WHERE t.status = ?
  ORDER BY t.order_value DESC, t.updated DESC
  LIMIT 1
`);
        const ticket = stmt.get(status);
        if (!ticket)
            return null;
        // Get complexity metadata
        const complexityStmt = this.db.prepare('SELECT * FROM complexity WHERE ticket_id = ?');
        const complexityData = complexityStmt.get(ticket.id);
        // Ensure all complexity fields are properly initialized
        if (complexityData) {
            ticket.complexity_metadata = {
                ticket_id: ticket.id,
                files_touched: complexityData.files_touched || 0,
                modules_crossed: complexityData.modules_crossed || 0,
                stack_layers_involved: complexityData.stack_layers_involved || 0,
                dependencies: complexityData.dependencies || 0,
                shared_state_touches: complexityData.shared_state_touches || 0,
                cascade_impact_zones: complexityData.cascade_impact_zones || 0,
                subjectivity_rating: complexityData.subjectivity_rating || 0,
                loc_added: complexityData.loc_added || 0,
                loc_modified: complexityData.loc_modified || 0,
                test_cases_written: complexityData.test_cases_written || 0,
                edge_cases: complexityData.edge_cases || 0,
                mocking_complexity: complexityData.mocking_complexity || 0,
                coordination_touchpoints: complexityData.coordination_touchpoints || 0,
                review_rounds: complexityData.review_rounds || 0,
                blockers_encountered: complexityData.blockers_encountered || 0,
                cie_score: complexityData.cie_score || 0,
            };
        }
        else {
            // Initialize with default values if no complexity data exists
            ticket.complexity_metadata = {
                ticket_id: ticket.id,
                files_touched: 0,
                modules_crossed: 0,
                stack_layers_involved: 0,
                dependencies: 0,
                shared_state_touches: 0,
                cascade_impact_zones: 0,
                subjectivity_rating: 0,
                loc_added: 0,
                loc_modified: 0,
                test_cases_written: 0,
                edge_cases: 0,
                mocking_complexity: 0,
                coordination_touchpoints: 0,
                review_rounds: 0,
                blockers_encountered: 0,
                cie_score: 0,
            };
        }
        // Get comments
        const commentsStmt = this.db.prepare('SELECT * FROM comments WHERE ticket_id = ? ORDER BY timestamp');
        ticket.comments = commentsStmt.all(ticket.id);
        return ticket;
    }
    /**
     * Reorder a ticket within its current status column
     * @param id The ID of the ticket to reorder
     * @param newOrderValue The new order value for the ticket
     * @returns True if the ticket was reordered successfully, false otherwise
     */
    reorderTicket(id, newOrderValue) {
        // Check if the ticket exists
        const existingTicket = this.getTicketById(id);
        if (!existingTicket)
            return false;
        // Update the ticket's order_value
        const stmt = this.db.prepare(`
      UPDATE tickets
      SET
        order_value = ?,
        updated = ?
      WHERE id = ?
    `);
        const result = stmt.run(newOrderValue, new Date().toISOString(), id);
        return result.changes > 0;
    }
    /**
     * Move a ticket to a different status and optionally reorder it
     * If no new order value is specified, the ticket will be placed at the bottom of the new status column
     * @param id The ID of the ticket to move
     * @param newStatus The new status for the ticket
     * @param newOrderValue Optional new order value for the ticket
     * @returns True if the ticket was moved successfully, false otherwise
     */
    moveTicket(id, newStatus, newOrderValue) {
        // Check if the ticket exists
        const existingTicket = this.getTicketById(id);
        if (!existingTicket)
            return false;
        // If no order value is specified, place the ticket at the bottom of the new status column
        if (newOrderValue === undefined) {
            // Find the minimum order value in the new status column
            const minOrderStmt = this.db.prepare(`
        SELECT MIN(order_value) as min_order
        FROM tickets
        WHERE status = ?
      `);
            const result = minOrderStmt.get(newStatus);
            // If there are tickets in the new status, place this one below them
            // Otherwise, start at 1000
            if (result && result.min_order !== null) {
                newOrderValue = result.min_order - 1000;
            }
            else {
                newOrderValue = 1000;
            }
        }
        // Update the ticket's status and order_value
        const stmt = this.db.prepare(`
      UPDATE tickets
      SET
        status = ?,
        order_value = ?,
        updated = ?
      WHERE id = ?
    `);
        const result = stmt.run(newStatus, newOrderValue, new Date().toISOString(), id);
        return result.changes > 0;
    }
}
exports.TicketQueries = TicketQueries;
//# sourceMappingURL=queries.js.map