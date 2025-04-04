/**
 * Shared utility for calculating complexity scores
 * This ensures consistent scoring between the frontend and backend
 */
export declare const WEIGHTS: {
    code_surface_area: number;
    interconnectedness: number;
    cognitive_load: number;
    change_volume: number;
    quality_surface_area: number;
    process_friction: number;
};
export declare const NORMALIZATION: {
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
};
/**
 * Calculate the complexity score based on the provided metrics
 * @param metrics The complexity metrics
 * @returns The calculated complexity score (0-100)
 */
export declare function calculateComplexityScore(metrics: {
    files_touched?: number;
    modules_crossed?: number;
    stack_layers_involved?: number;
    dependencies?: number;
    shared_state_touches?: number;
    cascade_impact_zones?: number;
    subjectivity_rating?: number;
    loc_added?: number;
    loc_modified?: number;
    test_cases_written?: number;
    edge_cases?: number;
    mocking_complexity?: number;
    coordination_touchpoints?: number;
    review_rounds?: number;
    blockers_encountered?: number;
}): number;
//# sourceMappingURL=complexityCalculator.d.ts.map