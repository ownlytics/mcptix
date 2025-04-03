import Database from 'better-sqlite3';
import { Ticket, Comment, ComplexityMetadata, TicketFilter, ExportedData } from '../types';
import { calculateComplexityScore } from '../utils/complexityCalculator';

export class TicketQueries {
  constructor(private db: Database.Database) {}

  // Get all tickets with optional filtering
  getTickets(
    filters: TicketFilter = {}, 
    sort: string = 'updated', 
    order: string = 'desc', 
    limit: number = 100, 
    offset: number = 0
  ): Ticket[] {
    // Build WHERE clause from filters
    const whereConditions = [];
    const params: any = {};
    
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
    const tickets = stmt.all({...params, limit, offset}) as Ticket[];
    
    // For each ticket, get its full complexity metadata
    for (const ticket of tickets) {
      const complexityStmt = this.db.prepare('SELECT * FROM complexity WHERE ticket_id = ?');
      const complexityData = complexityStmt.get(ticket.id) as ComplexityMetadata | undefined;
      
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
          cie_score: complexityData.cie_score || 0
        };
      } else {
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
          cie_score: 0
        };
      }
    }
    
    return tickets;
  }

  // Get ticket by ID with comments and complexity
  getTicketById(id: string): Ticket | null {
    const ticketStmt = this.db.prepare('SELECT * FROM tickets WHERE id = ?');
    const ticket = ticketStmt.get(id) as Ticket | undefined;
    
    if (!ticket) return null;
    
    // Get comments
    const commentsStmt = this.db.prepare('SELECT * FROM comments WHERE ticket_id = ? ORDER BY timestamp');
    ticket.comments = commentsStmt.all(id) as Comment[];
    
    // Get complexity metadata
    const complexityStmt = this.db.prepare('SELECT * FROM complexity WHERE ticket_id = ?');
    const complexityData = complexityStmt.get(id) as ComplexityMetadata | undefined;
    
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
        cie_score: complexityData.cie_score || 0
      };
    } else {
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
        cie_score: 0
      };
    }
    
    return ticket;
  }

  // Create a new ticket
  createTicket(ticket: Ticket): string {
    const now = new Date().toISOString();
    const ticketId = ticket.id || `ticket-${Date.now()}`;
    
    // Start transaction
    const transaction = this.db.transaction(() => {
      // Insert ticket
      const ticketStmt = this.db.prepare(`
        INSERT INTO tickets (id, title, description, priority, status, created, updated)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      ticketStmt.run(
        ticketId,
        ticket.title,
        ticket.description || '',
        ticket.priority || 'medium',
        ticket.status || 'backlog',
        now,
        now
      );
      
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
          blockers_encountered: ticket.complexity_metadata.blockers_encountered || 0
        };
        
        // Calculate the CIE score on the server side
        const cieScore = calculateComplexityScore(complexityMetrics);
        
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
        
        complexityStmt.run(
          ticketId,
          complexityMetrics.files_touched,
          complexityMetrics.modules_crossed,
          complexityMetrics.stack_layers_involved,
          complexityMetrics.dependencies,
          complexityMetrics.shared_state_touches,
          complexityMetrics.cascade_impact_zones,
          complexityMetrics.subjectivity_rating,
          complexityMetrics.loc_added,
          complexityMetrics.loc_modified,
          complexityMetrics.test_cases_written,
          complexityMetrics.edge_cases,
          complexityMetrics.mocking_complexity,
          complexityMetrics.coordination_touchpoints,
          complexityMetrics.review_rounds,
          complexityMetrics.blockers_encountered,
          cieScore // Use the server-calculated score
        );
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
          commentStmt.run(
            comment.id || `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            ticketId,
            comment.content || '',
            comment.type || 'comment',
            comment.author || 'developer',
            comment.status || 'open',
            comment.timestamp || now,
            comment.summary || null,
            comment.fullText || null,
            comment.display || 'collapsed'
          );
        }
      }
      
      return ticketId;
    });
    
    // Execute transaction
    return transaction();
  }

  // Update an existing ticket
  updateTicket(ticket: Ticket): boolean {
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
            updated = ?
        WHERE id = ?
      `);
      
      const result = ticketStmt.run(
        ticket.title,
        ticket.description || '',
        ticket.priority || 'medium',
        ticket.status || 'backlog',
        now,
        ticket.id
      );
      
      if (result.changes === 0) return false;
      
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
          blockers_encountered: ticket.complexity_metadata.blockers_encountered || 0
        };
        
        // Calculate the CIE score on the server side
        const cieScore = calculateComplexityScore(complexityMetrics);
        
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
        
        complexityStmt.run(
          ticket.id,
          complexityMetrics.files_touched,
          complexityMetrics.modules_crossed,
          complexityMetrics.stack_layers_involved,
          complexityMetrics.dependencies,
          complexityMetrics.shared_state_touches,
          complexityMetrics.cascade_impact_zones,
          complexityMetrics.subjectivity_rating,
          complexityMetrics.loc_added,
          complexityMetrics.loc_modified,
          complexityMetrics.test_cases_written,
          complexityMetrics.edge_cases,
          complexityMetrics.mocking_complexity,
          complexityMetrics.coordination_touchpoints,
          complexityMetrics.review_rounds,
          complexityMetrics.blockers_encountered,
          cieScore // Use the server-calculated score
        );
      }
      
      return true;
    });
    
    // Execute transaction
    return transaction();
  }

  // Delete a ticket
  deleteTicket(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM tickets WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Add a comment to a ticket
  addComment(ticketId: string, comment: Comment): string {
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
    
    stmt.run(
      commentId,
      ticketId,
      comment.content || '',
      comment.type || 'comment',
      comment.author || 'developer',
      comment.status || 'open',
      comment.timestamp || now,
      comment.summary || null,
      comment.fullText || null,
      comment.display || 'collapsed'
    );
    
    // Update ticket's updated timestamp
    this.db.prepare('UPDATE tickets SET updated = ? WHERE id = ?').run(now, ticketId);
    
    return commentId;
  }

  // Export all data to JSON format (for Git compatibility)
  exportToJson(): ExportedData {
    const columns: Array<{id: string, name: string, tickets: Ticket[]}> = [
      { id: 'backlog', name: 'Backlog', tickets: [] },
      { id: 'up-next', name: 'Up Next', tickets: [] },
      { id: 'in-progress', name: 'In Progress', tickets: [] },
      { id: 'in-review', name: 'In Review', tickets: [] },
      { id: 'completed', name: 'Completed', tickets: [] }
    ];
    
    // Get all tickets with their complexity and comments
    const ticketsStmt = this.db.prepare(`
      SELECT t.*
      FROM tickets t
      ORDER BY t.updated DESC
    `);
    
    const tickets = ticketsStmt.all() as Ticket[];
    
    // Get complexity for each ticket
    const complexityStmt = this.db.prepare('SELECT * FROM complexity WHERE ticket_id = ?');
    
    // Get comments for each ticket
    const commentsStmt = this.db.prepare('SELECT * FROM comments WHERE ticket_id = ? ORDER BY timestamp');
    
    // Organize tickets by column
    for (const ticket of tickets) {
      // Add complexity metadata
      const complexityData = complexityStmt.get(ticket.id) as ComplexityMetadata | undefined;
      
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
          cie_score: complexityData.cie_score || 0
        };
      } else {
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
          cie_score: 0
        };
      }
      
      // Add comments
      ticket.comments = commentsStmt.all(ticket.id) as Comment[];
      
      // Add to appropriate column
      const column = columns.find(col => col.id === ticket.status);
      if (column) {
        column.tickets.push(ticket);
      }
    }
    
    return { columns };
  }
}