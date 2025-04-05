import { calculateComplexityScore, WEIGHTS, NORMALIZATION } from './complexityCalculator';

describe('complexityCalculator', () => {
  describe('calculateComplexityScore', () => {
    test('should return 0 for empty metrics', () => {
      const score = calculateComplexityScore({});
      expect(score).toBe(0);
    });

    test('should handle metrics with all zeros', () => {
      const metrics = {
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
      };
      const score = calculateComplexityScore(metrics);
      expect(score).toBe(0);
    });

    test('should correctly calculate score with partial metrics', () => {
      const metrics = {
        files_touched: 5,
        modules_crossed: 2,
        loc_added: 200,
      };

      // Calculate expected score manually
      // code_surface_area = (5/10 + 2/5 + 0/3) / 3 = (0.5 + 0.4 + 0) / 3 = 0.3
      // interconnectedness = (0/10 + 0/5 + 0/5) / 3 = 0
      // cognitive_load = 0/1 = 0
      // change_volume = (200/500 + 0/300) / 2 = (0.4 + 0) / 2 = 0.2
      // quality_surface_area = (0/20 + 0/10 + 0/5) / 3 = 0
      // process_friction = (0/5 + 0/3 + 0/3) / 3 = 0

      // Weighted score = 0.3 * 0.15 + 0 * 0.2 + 0 * 0.25 + 0.2 * 0.15 + 0 * 0.15 + 0 * 0.1
      //                = 0.045 + 0 + 0 + 0.03 + 0 + 0 = 0.075
      // Final score = 0.075 * 100 = 7.5, rounded to 7.5

      const expectedScore = 7.5;
      const score = calculateComplexityScore(metrics);
      expect(score).toBe(expectedScore);
    });

    test('should correctly calculate score with all metrics', () => {
      const metrics = {
        files_touched: 5,
        modules_crossed: 3,
        stack_layers_involved: 2,
        dependencies: 7,
        shared_state_touches: 3,
        cascade_impact_zones: 2,
        subjectivity_rating: 0.8,
        loc_added: 300,
        loc_modified: 150,
        test_cases_written: 15,
        edge_cases: 7,
        mocking_complexity: 3,
        coordination_touchpoints: 4,
        review_rounds: 2,
        blockers_encountered: 1,
      };

      // Calculate expected score manually
      // code_surface_area = (5/10 + 3/5 + 2/3) / 3 = (0.5 + 0.6 + 0.667) / 3 = 0.589
      // interconnectedness = (7/10 + 3/5 + 2/5) / 3 = (0.7 + 0.6 + 0.4) / 3 = 0.567
      // cognitive_load = 0.8/1 = 0.8
      // change_volume = (300/500 + 150/300) / 2 = (0.6 + 0.5) / 2 = 0.55
      // quality_surface_area = (15/20 + 7/10 + 3/5) / 3 = (0.75 + 0.7 + 0.6) / 3 = 0.683
      // process_friction = (4/5 + 2/3 + 1/3) / 3 = (0.8 + 0.667 + 0.333) / 3 = 0.6

      // Weighted score = 0.589 * 0.15 + 0.567 * 0.2 + 0.8 * 0.25 + 0.55 * 0.15 + 0.683 * 0.15 + 0.6 * 0.1
      //                = 0.088 + 0.113 + 0.2 + 0.083 + 0.102 + 0.06 = 0.646
      // Final score = 0.646 * 100 = 64.6, rounded to 64.6

      const score = calculateComplexityScore(metrics);
      expect(score).toBeCloseTo(64.7, 1);
    });

    test('should cap score at 100 for extreme values', () => {
      const metrics = {
        files_touched: 50,
        modules_crossed: 20,
        stack_layers_involved: 10,
        dependencies: 50,
        shared_state_touches: 25,
        cascade_impact_zones: 25,
        subjectivity_rating: 1,
        loc_added: 2500,
        loc_modified: 1500,
        test_cases_written: 100,
        edge_cases: 50,
        mocking_complexity: 25,
        coordination_touchpoints: 25,
        review_rounds: 15,
        blockers_encountered: 15,
      };

      const score = calculateComplexityScore(metrics);
      expect(score).toBe(100);
    });

    test('should handle undefined metrics by treating them as 0', () => {
      const metrics = {
        files_touched: 5,
        // modules_crossed is undefined
        stack_layers_involved: 2,
      };

      // Calculate expected score manually
      // code_surface_area = (5/10 + 0/5 + 2/3) / 3 = (0.5 + 0 + 0.667) / 3 = 0.389
      // Other categories are 0

      // Weighted score = 0.389 * 0.15 = 0.058
      // Final score = 0.058 * 100 = 5.8, rounded to 5.8

      const score = calculateComplexityScore(metrics);
      expect(score).toBeCloseTo(5.8, 1);
    });

    test('should correctly apply normalization factors', () => {
      // Test that each metric is properly normalized
      const metrics = {
        files_touched: NORMALIZATION.files_touched, // Should normalize to 1.0
        modules_crossed: 0,
        stack_layers_involved: 0,
      };

      // code_surface_area = (1 + 0 + 0) / 3 = 0.333
      // Weighted score = 0.333 * 0.15 = 0.05
      // Final score = 0.05 * 100 = 5

      const score = calculateComplexityScore(metrics);
      expect(score).toBeCloseTo(5, 0);
    });

    test('should correctly apply weights to each category', () => {
      // Test cognitive_load which has the highest weight (0.25)
      const metrics1 = {
        subjectivity_rating: 1, // This is the only metric in cognitive_load
      };

      // cognitive_load = 1.0
      // Weighted score = 1.0 * 0.25 = 0.25
      // Final score = 0.25 * 100 = 25

      const score1 = calculateComplexityScore(metrics1);
      expect(score1).toBe(25);

      // Test process_friction which has the lowest weight (0.1)
      const metrics2 = {
        coordination_touchpoints: 5, // Max value for this metric
        review_rounds: 3, // Max value for this metric
        blockers_encountered: 3, // Max value for this metric
      };

      // process_friction = (5/5 + 3/3 + 3/3) / 3 = (1 + 1 + 1) / 3 = 1.0
      // Weighted score = 1.0 * 0.1 = 0.1
      // Final score = 0.1 * 100 = 10

      const score2 = calculateComplexityScore(metrics2);
      expect(score2).toBe(10);
    });

    test('should round the final score to 1 decimal place', () => {
      const metrics = {
        files_touched: 1,
        // This would give a raw score that needs rounding
      };

      // code_surface_area = (1/10 + 0/5 + 0/3) / 3 = 0.033
      // Weighted score = 0.033 * 0.15 = 0.00495
      // Final score = 0.00495 * 100 = 0.495, rounded to 0.5

      const score = calculateComplexityScore(metrics);
      expect(score).toBe(0.5);
    });
  });
});
