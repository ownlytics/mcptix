"use strict";
/**
 * Shared utility for calculating complexity scores
 * This ensures consistent scoring between the frontend and backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NORMALIZATION = exports.WEIGHTS = void 0;
exports.calculateComplexityScore = calculateComplexityScore;
// Weights for each complexity factor
exports.WEIGHTS = {
    code_surface_area: 0.15,
    interconnectedness: 0.2,
    cognitive_load: 0.25,
    change_volume: 0.15,
    quality_surface_area: 0.15,
    process_friction: 0.1,
};
// Normalization factors for each metric
exports.NORMALIZATION = {
    files_touched: 10,
    modules_crossed: 5,
    stack_layers_involved: 3,
    dependencies: 10,
    shared_state_touches: 5,
    cascade_impact_zones: 5,
    subjectivity_rating: 1,
    loc_added: 500,
    loc_modified: 300,
    test_cases_written: 20,
    edge_cases: 10,
    mocking_complexity: 5,
    coordination_touchpoints: 5,
    review_rounds: 3,
    blockers_encountered: 3,
};
/**
 * Calculate the complexity score based on the provided metrics
 * @param metrics The complexity metrics
 * @returns The calculated complexity score (0-100)
 */
function calculateComplexityScore(metrics) {
    // Ensure all values are defined
    const values = {
        files_touched: metrics.files_touched || 0,
        modules_crossed: metrics.modules_crossed || 0,
        stack_layers_involved: metrics.stack_layers_involved || 0,
        dependencies: metrics.dependencies || 0,
        shared_state_touches: metrics.shared_state_touches || 0,
        cascade_impact_zones: metrics.cascade_impact_zones || 0,
        subjectivity_rating: metrics.subjectivity_rating || 0,
        loc_added: metrics.loc_added || 0,
        loc_modified: metrics.loc_modified || 0,
        test_cases_written: metrics.test_cases_written || 0,
        edge_cases: metrics.edge_cases || 0,
        mocking_complexity: metrics.mocking_complexity || 0,
        coordination_touchpoints: metrics.coordination_touchpoints || 0,
        review_rounds: metrics.review_rounds || 0,
        blockers_encountered: metrics.blockers_encountered || 0,
    };
    // Calculate normalized scores for each category
    const normalizedScores = {
        code_surface_area: (values.files_touched / exports.NORMALIZATION.files_touched +
            values.modules_crossed / exports.NORMALIZATION.modules_crossed +
            values.stack_layers_involved / exports.NORMALIZATION.stack_layers_involved) /
            3,
        interconnectedness: (values.dependencies / exports.NORMALIZATION.dependencies +
            values.shared_state_touches / exports.NORMALIZATION.shared_state_touches +
            values.cascade_impact_zones / exports.NORMALIZATION.cascade_impact_zones) /
            3,
        cognitive_load: values.subjectivity_rating / exports.NORMALIZATION.subjectivity_rating,
        change_volume: (values.loc_added / exports.NORMALIZATION.loc_added +
            values.loc_modified / exports.NORMALIZATION.loc_modified) /
            2,
        quality_surface_area: (values.test_cases_written / exports.NORMALIZATION.test_cases_written +
            values.edge_cases / exports.NORMALIZATION.edge_cases +
            values.mocking_complexity / exports.NORMALIZATION.mocking_complexity) /
            3,
        process_friction: (values.coordination_touchpoints / exports.NORMALIZATION.coordination_touchpoints +
            values.review_rounds / exports.NORMALIZATION.review_rounds +
            values.blockers_encountered / exports.NORMALIZATION.blockers_encountered) /
            3,
    };
    // Apply weights and calculate final score
    let weightedScore = 0;
    for (const category in normalizedScores) {
        weightedScore +=
            normalizedScores[category] *
                exports.WEIGHTS[category];
    }
    // Scale to 0-100 and round to 1 decimal place
    const finalScore = Math.min(100, weightedScore * 100);
    return Math.round(finalScore * 10) / 10;
}
//# sourceMappingURL=complexityCalculator.js.map