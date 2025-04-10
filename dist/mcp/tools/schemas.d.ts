export declare const toolSchemas: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            status: {
                type: string;
                description: string;
                enum: string[];
                default?: undefined;
            };
            priority: {
                type: string;
                description: string;
                enum: string[];
                default?: undefined;
            };
            search: {
                type: string;
                description: string;
            };
            sort: {
                type: string;
                description: string;
                default: string;
            };
            order: {
                type: string;
                description: string;
                enum: string[];
                default: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            offset: {
                type: string;
                description: string;
                default: number;
            };
            id?: undefined;
            title?: undefined;
            description?: undefined;
            complexity_metadata?: undefined;
            agent_context?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            query?: undefined;
            group_by?: undefined;
            order_value?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required?: undefined;
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            status?: undefined;
            priority?: undefined;
            search?: undefined;
            sort?: undefined;
            order?: undefined;
            limit?: undefined;
            offset?: undefined;
            title?: undefined;
            description?: undefined;
            complexity_metadata?: undefined;
            agent_context?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            query?: undefined;
            group_by?: undefined;
            order_value?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required: string[];
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                description: string;
                enum: string[];
                default: string;
            };
            status: {
                type: string;
                description: string;
                enum: string[];
                default: string;
            };
            complexity_metadata: {
                type: string;
                description: string;
                properties: {
                    files_touched: {
                        type: string;
                    };
                    modules_crossed: {
                        type: string;
                    };
                    stack_layers_involved: {
                        type: string;
                    };
                    dependencies: {
                        type: string;
                    };
                    shared_state_touches: {
                        type: string;
                    };
                    cascade_impact_zones: {
                        type: string;
                    };
                    subjectivity_rating: {
                        type: string;
                    };
                    loc_added: {
                        type: string;
                    };
                    loc_modified: {
                        type: string;
                    };
                    test_cases_written: {
                        type: string;
                    };
                    edge_cases: {
                        type: string;
                    };
                    mocking_complexity: {
                        type: string;
                    };
                    coordination_touchpoints: {
                        type: string;
                    };
                    review_rounds: {
                        type: string;
                    };
                    blockers_encountered: {
                        type: string;
                    };
                    cie_score: {
                        type: string;
                    };
                };
            };
            agent_context: {
                type: string;
                description: string;
            };
            search?: undefined;
            sort?: undefined;
            order?: undefined;
            limit?: undefined;
            offset?: undefined;
            id?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            query?: undefined;
            group_by?: undefined;
            order_value?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required: string[];
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            priority: {
                type: string;
                description: string;
                enum: string[];
                default?: undefined;
            };
            status: {
                type: string;
                description: string;
                enum: string[];
                default?: undefined;
            };
            complexity_metadata: {
                type: string;
                description: string;
                properties: {
                    files_touched: {
                        type: string;
                    };
                    modules_crossed: {
                        type: string;
                    };
                    stack_layers_involved: {
                        type: string;
                    };
                    dependencies: {
                        type: string;
                    };
                    shared_state_touches: {
                        type: string;
                    };
                    cascade_impact_zones: {
                        type: string;
                    };
                    subjectivity_rating: {
                        type: string;
                    };
                    loc_added: {
                        type: string;
                    };
                    loc_modified: {
                        type: string;
                    };
                    test_cases_written: {
                        type: string;
                    };
                    edge_cases: {
                        type: string;
                    };
                    mocking_complexity: {
                        type: string;
                    };
                    coordination_touchpoints: {
                        type: string;
                    };
                    review_rounds: {
                        type: string;
                    };
                    blockers_encountered: {
                        type: string;
                    };
                    cie_score: {
                        type: string;
                    };
                };
            };
            agent_context: {
                type: string;
                description: string;
            };
            search?: undefined;
            sort?: undefined;
            order?: undefined;
            limit?: undefined;
            offset?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            query?: undefined;
            group_by?: undefined;
            order_value?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required: string[];
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            ticket_id: {
                type: string;
                description: string;
            };
            content: {
                type: string;
                description: string;
            };
            author: {
                type: string;
                description: string;
                enum: string[];
                default: string;
            };
            status?: undefined;
            priority?: undefined;
            search?: undefined;
            sort?: undefined;
            order?: undefined;
            limit?: undefined;
            offset?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            complexity_metadata?: undefined;
            agent_context?: undefined;
            query?: undefined;
            group_by?: undefined;
            order_value?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required: string[];
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                description: string;
                enum: string[];
                default?: undefined;
            };
            priority: {
                type: string;
                description: string;
                enum: string[];
                default?: undefined;
            };
            sort: {
                type: string;
                description: string;
                default: string;
            };
            order: {
                type: string;
                description: string;
                enum: string[];
                default: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            offset: {
                type: string;
                description: string;
                default: number;
            };
            search?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            complexity_metadata?: undefined;
            agent_context?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            group_by?: undefined;
            order_value?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required: string[];
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            group_by: {
                type: string;
                description: string;
                enum: string[];
                default: string;
            };
            status?: undefined;
            priority?: undefined;
            search?: undefined;
            sort?: undefined;
            order?: undefined;
            limit?: undefined;
            offset?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            complexity_metadata?: undefined;
            agent_context?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            query?: undefined;
            order_value?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required?: undefined;
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            status: {
                type: string;
                description: string;
                enum: string[];
                default?: undefined;
            };
            priority?: undefined;
            search?: undefined;
            sort?: undefined;
            order?: undefined;
            limit?: undefined;
            offset?: undefined;
            id?: undefined;
            title?: undefined;
            description?: undefined;
            complexity_metadata?: undefined;
            agent_context?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            query?: undefined;
            group_by?: undefined;
            order_value?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required: string[];
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            order_value: {
                type: string;
                description: string;
            };
            status?: undefined;
            priority?: undefined;
            search?: undefined;
            sort?: undefined;
            order?: undefined;
            limit?: undefined;
            offset?: undefined;
            title?: undefined;
            description?: undefined;
            complexity_metadata?: undefined;
            agent_context?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            query?: undefined;
            group_by?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required: string[];
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                description: string;
                enum: string[];
                default?: undefined;
            };
            order_value: {
                type: string;
                description: string;
            };
            priority?: undefined;
            search?: undefined;
            sort?: undefined;
            order?: undefined;
            limit?: undefined;
            offset?: undefined;
            title?: undefined;
            description?: undefined;
            complexity_metadata?: undefined;
            agent_context?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            query?: undefined;
            group_by?: undefined;
            field?: undefined;
            replace?: undefined;
            useRegex?: undefined;
            caseSensitive?: undefined;
        };
        required: string[];
        markdownDescription?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            id: {
                type: string;
                description: string;
            };
            field: {
                type: string;
                description: string;
                enum: string[];
            };
            search: {
                type: string;
                description: string;
            };
            replace: {
                type: string;
                description: string;
            };
            useRegex: {
                type: string;
                description: string;
                default: boolean;
            };
            caseSensitive: {
                type: string;
                description: string;
                default: boolean;
            };
            status?: undefined;
            priority?: undefined;
            sort?: undefined;
            order?: undefined;
            limit?: undefined;
            offset?: undefined;
            title?: undefined;
            description?: undefined;
            complexity_metadata?: undefined;
            agent_context?: undefined;
            ticket_id?: undefined;
            content?: undefined;
            author?: undefined;
            query?: undefined;
            group_by?: undefined;
            order_value?: undefined;
        };
        required: string[];
        markdownDescription: string;
    };
})[];
//# sourceMappingURL=schemas.d.ts.map