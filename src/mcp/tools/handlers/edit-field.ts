import { TicketQueries } from '../../../db/queries';
import { Ticket } from '../../../types';
import { Logger } from '../../../utils/logger';
import { createSuccessResponse, ToolResponse } from '../types';

export function handleEditField(ticketQueries: TicketQueries, args: any): ToolResponse {
  Logger.debug('McpServer', `handleEditField called with args: ${JSON.stringify(args)}`);

  if (!args.id) {
    Logger.warn('McpServer', 'Ticket ID is required');
    throw new Error('Ticket ID is required');
  }

  if (!args.field || !['title', 'description', 'agent_context'].includes(args.field)) {
    Logger.warn('McpServer', 'Valid field name is required (title, description, agent_context)');
    throw new Error('Valid field name is required (title, description, agent_context)');
  }

  if (args.search === undefined || args.replace === undefined) {
    Logger.warn('McpServer', 'Both search and replace parameters are required');
    throw new Error('Both search and replace parameters are required');
  }

  // Check if ticket exists
  Logger.debug('McpServer', `Getting ticket with ID: ${args.id}`);
  const existingTicket = ticketQueries.getTicketById(args.id);
  if (!existingTicket) {
    Logger.warn('McpServer', `Ticket with ID ${args.id} not found`);
    throw new Error(`Ticket with ID ${args.id} not found`);
  }

  // Get current field value
  const currentValue = (existingTicket[args.field as keyof Ticket] as string) || '';
  Logger.debug(
    'McpServer',
    `Current value of ${args.field}: ${currentValue.substring(0, 50)}${currentValue.length > 50 ? '...' : ''}`,
  );

  // Get search/replace parameters
  const useRegex = args.useRegex === true;
  const caseSensitive = args.caseSensitive !== false;

  Logger.debug(
    'McpServer',
    `Performing find/replace: Mode=${useRegex ? 'regex' : 'literal'}, CaseSensitive=${caseSensitive}`,
  );
  Logger.debug('McpServer', `Search: '${args.search.substring(0, 30)}${args.search.length > 30 ? '...' : ''}'`);
  Logger.debug('McpServer', `Replace: '${args.replace.substring(0, 30)}${args.replace.length > 30 ? '...' : ''}'`);

  let newValue: string;
  let replacementCount = 0;

  try {
    if (useRegex) {
      // Use the search string directly as a regex pattern
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(args.search, flags);
      newValue = currentValue.replace(regex, args.replace);

      // Count replacements
      try {
        const countRegex = new RegExp(args.search, caseSensitive ? 'g' : 'gi');
        const matches = currentValue.match(countRegex);
        replacementCount = matches ? matches.length : 0;
      } catch (countError) {
        // If counting fails, just set to 0
        Logger.warn(
          'McpServer',
          `Could not count replacements: ${countError instanceof Error ? countError.message : String(countError)}`,
        );
      }
    } else {
      // Perform literal string replacement (escape regex special chars)
      const safeSearch = args.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(safeSearch, flags);
      newValue = currentValue.replace(regex, args.replace);

      // Count literal string occurrences
      let count = 0;
      let lastIndex = 0;
      if (caseSensitive) {
        while ((lastIndex = currentValue.indexOf(args.search, lastIndex)) !== -1) {
          count++;
          lastIndex += args.search.length;
        }
      } else {
        const lowerText = currentValue.toLowerCase();
        const lowerSearch = args.search.toLowerCase();
        while ((lastIndex = lowerText.indexOf(lowerSearch, lastIndex)) !== -1) {
          count++;
          lastIndex += lowerSearch.length;
        }
      }
      replacementCount = count;
    }
  } catch (error) {
    Logger.error('McpServer', `Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Only update if something changed
  if (currentValue === newValue) {
    Logger.debug('McpServer', `No changes needed for ticket ${args.id}`);
    return createSuccessResponse({
      id: args.id,
      success: true,
      changed: false,
      message: 'No changes made - search text not found',
    });
  }

  Logger.debug('McpServer', `Updating ${args.field} for ticket ${args.id} (${replacementCount} replacements)`);

  // Create updated ticket with the modified field
  let ticket: Ticket = {
    ...existingTicket,
    updated: new Date().toISOString(),
  };

  // Update the specific field based on field name
  if (args.field === 'title') {
    ticket.title = newValue;
  } else if (args.field === 'description') {
    ticket.description = newValue;
  } else if (args.field === 'agent_context') {
    ticket.agent_context = newValue;
  }

  // Update ticket
  const success = ticketQueries.updateTicket(ticket);
  Logger.debug('McpServer', `Update result for ticket ${args.id}: ${success}`);

  return createSuccessResponse({
    id: args.id,
    success,
    changed: true,
    message: 'Field updated successfully',
    replacement_count: replacementCount,
  });
}
