"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolSchemas = void 0;
// All tool schemas in one place for better organization
exports.toolSchemas = [
    {
        name: 'list_tickets',
        description: 'List tickets with optional filtering, sorting, and pagination',
        inputSchema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'Filter by status',
                    enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
                },
                priority: {
                    type: 'string',
                    description: 'Filter by priority',
                    enum: ['low', 'medium', 'high'],
                },
                search: {
                    type: 'string',
                    description: 'Search term for title and description',
                },
                sort: {
                    type: 'string',
                    description: 'Sort field',
                    default: 'updated',
                },
                order: {
                    type: 'string',
                    description: 'Sort order',
                    enum: ['asc', 'desc'],
                    default: 'desc',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of tickets to return',
                    default: 100,
                },
                offset: {
                    type: 'number',
                    description: 'Number of tickets to skip',
                    default: 0,
                },
            },
        },
    },
    {
        name: 'get_ticket',
        description: 'Get a ticket by ID',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Ticket ID',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'create_ticket',
        description: 'Create a new ticket',
        inputSchema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'Ticket title',
                },
                description: {
                    type: 'string',
                    description: 'Ticket description',
                },
                priority: {
                    type: 'string',
                    description: 'Ticket priority',
                    enum: ['low', 'medium', 'high'],
                    default: 'medium',
                },
                status: {
                    type: 'string',
                    description: 'Ticket status',
                    enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
                    default: 'backlog',
                },
                complexity_metadata: {
                    type: 'object',
                    description: 'Complexity metrics',
                    properties: {
                        files_touched: { type: 'number' },
                        modules_crossed: { type: 'number' },
                        stack_layers_involved: { type: 'number' },
                        dependencies: { type: 'number' },
                        shared_state_touches: { type: 'number' },
                        cascade_impact_zones: { type: 'number' },
                        subjectivity_rating: { type: 'number' },
                        loc_added: { type: 'number' },
                        loc_modified: { type: 'number' },
                        test_cases_written: { type: 'number' },
                        edge_cases: { type: 'number' },
                        mocking_complexity: { type: 'number' },
                        coordination_touchpoints: { type: 'number' },
                        review_rounds: { type: 'number' },
                        blockers_encountered: { type: 'number' },
                        cie_score: { type: 'number' },
                    },
                },
                agent_context: {
                    type: 'string',
                    description: 'Markdown-formatted workspace for the agent to store research, analysis, and implementation plans',
                },
            },
            required: ['title'],
        },
    },
    {
        name: 'update_ticket',
        description: 'Update an existing ticket (use edit_field instead for targeted text changes to save context space)',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Ticket ID',
                },
                title: {
                    type: 'string',
                    description: 'Ticket title',
                },
                description: {
                    type: 'string',
                    description: 'Ticket description',
                },
                priority: {
                    type: 'string',
                    description: 'Ticket priority',
                    enum: ['low', 'medium', 'high'],
                },
                status: {
                    type: 'string',
                    description: 'Ticket status',
                    enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
                },
                complexity_metadata: {
                    type: 'object',
                    description: 'Complexity metrics',
                    properties: {
                        files_touched: { type: 'number' },
                        modules_crossed: { type: 'number' },
                        stack_layers_involved: { type: 'number' },
                        dependencies: { type: 'number' },
                        shared_state_touches: { type: 'number' },
                        cascade_impact_zones: { type: 'number' },
                        subjectivity_rating: { type: 'number' },
                        loc_added: { type: 'number' },
                        loc_modified: { type: 'number' },
                        test_cases_written: { type: 'number' },
                        edge_cases: { type: 'number' },
                        mocking_complexity: { type: 'number' },
                        coordination_touchpoints: { type: 'number' },
                        review_rounds: { type: 'number' },
                        blockers_encountered: { type: 'number' },
                        cie_score: { type: 'number' },
                    },
                },
                agent_context: {
                    type: 'string',
                    description: 'Markdown-formatted workspace for the agent to store research, analysis, and implementation plans',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'delete_ticket',
        description: 'Delete a ticket',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Ticket ID',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'add_comment',
        description: 'Add a comment to a ticket',
        inputSchema: {
            type: 'object',
            properties: {
                ticket_id: {
                    type: 'string',
                    description: 'Ticket ID',
                },
                content: {
                    type: 'string',
                    description: 'Comment content (supports markdown)',
                },
                author: {
                    type: 'string',
                    description: 'Comment author',
                    enum: ['developer', 'agent'],
                    default: 'agent',
                },
            },
            required: ['ticket_id', 'content'],
        },
    },
    {
        name: 'search_tickets',
        description: 'Search for tickets based on various criteria',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query',
                },
                status: {
                    type: 'string',
                    description: 'Filter by status',
                    enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
                },
                priority: {
                    type: 'string',
                    description: 'Filter by priority',
                    enum: ['low', 'medium', 'high'],
                },
                sort: {
                    type: 'string',
                    description: 'Sort field',
                    default: 'relevance',
                },
                order: {
                    type: 'string',
                    description: 'Sort order',
                    enum: ['asc', 'desc'],
                    default: 'desc',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of tickets to return',
                    default: 100,
                },
                offset: {
                    type: 'number',
                    description: 'Number of tickets to skip',
                    default: 0,
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_stats',
        description: 'Get statistics about tickets in the system',
        inputSchema: {
            type: 'object',
            properties: {
                group_by: {
                    type: 'string',
                    description: 'Field to group by',
                    enum: ['status', 'priority'],
                    default: 'status',
                },
            },
        },
    },
    {
        name: 'get_next_ticket',
        description: 'Get the next ticket from a status category',
        inputSchema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'Status category to get the next ticket from',
                    enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
                },
            },
            required: ['status'],
        },
    },
    {
        name: 'reorder_ticket',
        description: 'Update the order of a ticket within its current status column',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Ticket ID',
                },
                order_value: {
                    type: 'number',
                    description: 'New order value for the ticket',
                },
            },
            required: ['id', 'order_value'],
        },
    },
    {
        name: 'move_ticket',
        description: 'Move a ticket to a different status and optionally reorder it',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Ticket ID',
                },
                status: {
                    type: 'string',
                    description: 'New status for the ticket',
                    enum: ['backlog', 'up-next', 'in-progress', 'in-review', 'completed'],
                },
                order_value: {
                    type: 'number',
                    description: 'Optional new order value for the ticket',
                },
            },
            required: ['id', 'status'],
        },
    },
    {
        name: 'edit_field',
        description: 'Efficiently perform targeted text changes on a ticket field (PREFERRED over update_ticket for field edits, supports regex and partial replacements to save context space compared to rewriting entire fields)',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Ticket ID',
                },
                field: {
                    type: 'string',
                    description: 'Field name to edit',
                    enum: ['title', 'description', 'agent_context'],
                },
                search: {
                    type: 'string',
                    description: 'Text to search for (or regex pattern if useRegex is true). Use this to target specific portions of text without rewriting the entire field.',
                },
                replace: {
                    type: 'string',
                    description: 'Replacement text (can include regex capturing groups like $1 if useRegex is true). This will replace only the matched text, preserving the rest of the field content.',
                },
                useRegex: {
                    type: 'boolean',
                    description: 'Use regular expressions for search and replace. Enables powerful pattern matching for complex replacements in code blocks, markdown, etc.',
                    default: false,
                },
                caseSensitive: {
                    type: 'boolean',
                    description: 'Whether the search is case-sensitive. Set to false to match text regardless of casing.',
                    default: true,
                },
            },
            required: ['id', 'field', 'search', 'replace'],
            markdownDescription: `
## Edit Field Tool
This tool efficiently performs targeted text replacements within specific ticket fields, saving valuable context space compared to rewriting entire fields.

### Benefits
- **Context Efficiency**: Makes small updates without resending large text blocks
- **Precision Editing**: Changes only what needs to be changed
- **Advanced Pattern Matching**: Supports regex for sophisticated replacements
- **Preserves Structure**: Maintains the overall structure of the field

### When to Use
- Updating code snippets in documentation
- Fixing typos or terminology
- Editing specific sections of a large field
- Refactoring code examples
- Making formatting changes

### Best Practices
- For small to medium changes, always prefer this over update_ticket
- Use regex mode for complex pattern matching
- Use capturing groups ($1, $2) to preserve parts of matched text
`,
        },
    },
];
//# sourceMappingURL=schemas.js.map