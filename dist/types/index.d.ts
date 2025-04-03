export interface Ticket {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'backlog' | 'up-next' | 'in-progress' | 'in-review' | 'completed';
    created: string;
    updated: string;
    complexity_metadata?: ComplexityMetadata;
    comments?: Comment[];
}
export interface ComplexityMetadata {
    ticket_id: string;
    files_touched: number;
    modules_crossed: number;
    stack_layers_involved: number;
    dependencies: number;
    shared_state_touches: number;
    cascade_impact_zones: number;
    subjectivity_rating: number;
    loc_added: number;
    loc_modified: number;
    test_cases_written: number;
    edge_cases: number;
    mocking_complexity: number;
    coordination_touchpoints: number;
    review_rounds: number;
    blockers_encountered: number;
    cie_score: number;
}
export interface Comment {
    id: string;
    ticket_id: string;
    content?: string;
    type: 'comment' | 'request_changes' | 'change_proposal';
    author: 'developer' | 'agent';
    status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
    timestamp: string;
    summary?: string;
    fullText?: string;
    display?: 'expanded' | 'collapsed';
}
export interface TicketFilter {
    status?: string;
    priority?: string;
    search?: string;
}
export interface ExportedData {
    columns: {
        id: string;
        name: string;
        tickets: Ticket[];
    }[];
}
