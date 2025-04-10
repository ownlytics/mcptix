import { sampleTickets, sampleComments, sampleComplexityMetrics } from '../../../api/test/fixtures';
export { sampleTickets, sampleComments, sampleComplexityMetrics };
export declare const sampleTicketWithOrderValue: {
    order_value: number;
    id: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    status: "backlog" | "up-next" | "in-progress" | "in-review" | "completed";
    created: string;
    updated: string;
    agent_context?: string;
    complexity_metadata?: import("../../..").ComplexityMetadata;
    comments?: import("../../..").Comment[];
};
export declare const sampleTicketWithAgentContext: {
    agent_context: string;
    id: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    status: "backlog" | "up-next" | "in-progress" | "in-review" | "completed";
    created: string;
    updated: string;
    complexity_metadata?: import("../../..").ComplexityMetadata;
    comments?: import("../../..").Comment[];
};
//# sourceMappingURL=fixtures.d.ts.map