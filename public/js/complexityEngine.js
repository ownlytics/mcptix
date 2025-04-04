/**
 * Complexity Intelligence Engine (CIE) for mcptix
 * Evaluates and records the retrospective complexity of tasks
 */

// DOM elements
let cieScore;
let filesInput;
let modulesInput;
let stackLayersInput;
let dependenciesInput;
let sharedStateInput;
let cascadeImpactInput;
let subjectivityInput;
let subjectivityValue;
let locAddedInput;
let locModifiedInput;
let testCasesInput;
let edgeCasesInput;
let mockingInput;
let coordinationInput;
let reviewRoundsInput;
let blockersInput;

// Weights for each complexity factor
const WEIGHTS = {
  code_surface_area: 0.15,
  interconnectedness: 0.2,
  cognitive_load: 0.25,
  change_volume: 0.15,
  quality_surface_area: 0.15,
  process_friction: 0.1,
};

// Normalization factors for each metric
const NORMALIZATION = {
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
 * Initialize the complexity engine
 */
function initialize() {
  console.log('Initializing complexity engine');

  // Get DOM elements
  cieScore = document.getElementById('cie-score');
  if (!cieScore) console.warn('CIE score element not found');

  filesInput = document.getElementById('files-touched');
  modulesInput = document.getElementById('modules-crossed');
  stackLayersInput = document.getElementById('stack-layers-involved');
  dependenciesInput = document.getElementById('dependencies');
  sharedStateInput = document.getElementById('shared-state-touches');
  cascadeImpactInput = document.getElementById('cascade-impact-zones');
  subjectivityInput = document.getElementById('subjectivity-rating');
  subjectivityValue = document.getElementById('subjectivity-value');
  locAddedInput = document.getElementById('loc-added');
  locModifiedInput = document.getElementById('loc-modified');
  testCasesInput = document.getElementById('test-cases-written');
  edgeCasesInput = document.getElementById('edge-cases');
  mockingInput = document.getElementById('mocking-complexity');
  coordinationInput = document.getElementById('coordination-touchpoints');
  reviewRoundsInput = document.getElementById('review-rounds');
  blockersInput = document.getElementById('blockers-encountered');

  // Log if any required elements are missing
  const requiredElements = [
    { name: 'filesInput', element: filesInput },
    { name: 'modulesInput', element: modulesInput },
    { name: 'stackLayersInput', element: stackLayersInput },
    { name: 'dependenciesInput', element: dependenciesInput },
    { name: 'sharedStateInput', element: sharedStateInput },
    { name: 'cascadeImpactInput', element: cascadeImpactInput },
    { name: 'subjectivityInput', element: subjectivityInput },
    { name: 'locAddedInput', element: locAddedInput },
    { name: 'locModifiedInput', element: locModifiedInput },
    { name: 'testCasesInput', element: testCasesInput },
    { name: 'edgeCasesInput', element: edgeCasesInput },
    { name: 'mockingInput', element: mockingInput },
    { name: 'coordinationInput', element: coordinationInput },
    { name: 'reviewRoundsInput', element: reviewRoundsInput },
    { name: 'blockersInput', element: blockersInput },
  ];

  requiredElements.forEach(item => {
    if (!item.element) console.warn(`${item.name} element not found`);
  });

  // Set up event listeners
  setupEventListeners();

  console.log('Complexity engine initialized');
}

/**
 * Set up event listeners for the complexity engine
 */
function setupEventListeners() {
  // Add event listeners to all inputs
  const inputs = [
    filesInput,
    modulesInput,
    stackLayersInput,
    dependenciesInput,
    sharedStateInput,
    cascadeImpactInput,
    subjectivityInput,
    locAddedInput,
    locModifiedInput,
    testCasesInput,
    edgeCasesInput,
    mockingInput,
    coordinationInput,
    reviewRoundsInput,
    blockersInput,
  ];

  inputs.forEach(input => {
    if (input) {
      input.addEventListener('input', updateComplexityScore);
    }
  });

  // Special handling for subjectivity slider
  if (subjectivityInput && subjectivityValue) {
    subjectivityInput.addEventListener('input', () => {
      subjectivityValue.textContent = parseFloat(subjectivityInput.value).toFixed(1);
    });
  }
}

/**
 * Update the complexity score based on current input values
 */
/**
 * This function is now a no-op as the score is calculated on the server
 * It's kept for compatibility with existing code
 */
function updateComplexityScore() {
  // This function no longer calculates the score
  // The score is now calculated on the server side
  return 0;
}

/**
 * Load complexity data into the form
 * @param {object} data - The complexity metadata to load
 */
function loadComplexityData(data) {
  if (!data) {
    resetComplexityData();
    return;
  }

  console.log('Loading complexity data:', data);

  // Set values in the form, ensuring all fields are set even if missing in data
  if (filesInput) filesInput.value = data.files_touched !== undefined ? data.files_touched : 0;
  if (modulesInput)
    modulesInput.value = data.modules_crossed !== undefined ? data.modules_crossed : 0;
  if (stackLayersInput)
    stackLayersInput.value =
      data.stack_layers_involved !== undefined ? data.stack_layers_involved : 0;
  if (dependenciesInput)
    dependenciesInput.value = data.dependencies !== undefined ? data.dependencies : 0;
  if (sharedStateInput)
    sharedStateInput.value =
      data.shared_state_touches !== undefined ? data.shared_state_touches : 0;
  if (cascadeImpactInput)
    cascadeImpactInput.value =
      data.cascade_impact_zones !== undefined ? data.cascade_impact_zones : 0;
  if (subjectivityInput) {
    subjectivityInput.value = data.subjectivity_rating !== undefined ? data.subjectivity_rating : 0;
    if (subjectivityValue) {
      subjectivityValue.textContent = parseFloat(subjectivityInput.value).toFixed(1);
    }
  }
  if (locAddedInput) locAddedInput.value = data.loc_added !== undefined ? data.loc_added : 0;
  if (locModifiedInput)
    locModifiedInput.value = data.loc_modified !== undefined ? data.loc_modified : 0;
  if (testCasesInput)
    testCasesInput.value = data.test_cases_written !== undefined ? data.test_cases_written : 0;
  if (edgeCasesInput) edgeCasesInput.value = data.edge_cases !== undefined ? data.edge_cases : 0;
  if (mockingInput)
    mockingInput.value = data.mocking_complexity !== undefined ? data.mocking_complexity : 0;
  if (coordinationInput)
    coordinationInput.value =
      data.coordination_touchpoints !== undefined ? data.coordination_touchpoints : 0;
  if (reviewRoundsInput)
    reviewRoundsInput.value = data.review_rounds !== undefined ? data.review_rounds : 0;
  if (blockersInput)
    blockersInput.value = data.blockers_encountered !== undefined ? data.blockers_encountered : 0;

  // Update the score display with the server-provided score
  if (data.cie_score !== undefined) {
    updateScoreDisplay(data.cie_score);
  }
}

/**
 * Reset complexity data to default values
 */
function resetComplexityData() {
  // Reset all inputs to 0
  if (filesInput) filesInput.value = 0;
  if (modulesInput) modulesInput.value = 0;
  if (stackLayersInput) stackLayersInput.value = 0;
  if (dependenciesInput) dependenciesInput.value = 0;
  if (sharedStateInput) sharedStateInput.value = 0;
  if (cascadeImpactInput) cascadeImpactInput.value = 0;
  if (subjectivityInput) {
    subjectivityInput.value = 0;
    if (subjectivityValue) {
      subjectivityValue.textContent = '0.0';
    }
  }
  if (locAddedInput) locAddedInput.value = 0;
  if (locModifiedInput) locModifiedInput.value = 0;
  if (testCasesInput) testCasesInput.value = 0;
  if (edgeCasesInput) edgeCasesInput.value = 0;
  if (mockingInput) mockingInput.value = 0;
  if (coordinationInput) coordinationInput.value = 0;
  if (reviewRoundsInput) reviewRoundsInput.value = 0;
  if (blockersInput) blockersInput.value = 0;

  // Update the score
  updateComplexityScore();
}

/**
 * Get the current complexity data from the form
 * @returns {object} The complexity metadata
 */
function getComplexityData() {
  // Return the data structure without calculating the score
  // The score will be calculated on the server side
  return {
    files_touched: parseInt(filesInput?.value) || 0,
    modules_crossed: parseInt(modulesInput?.value) || 0,
    stack_layers_involved: parseInt(stackLayersInput?.value) || 0,
    dependencies: parseInt(dependenciesInput?.value) || 0,
    shared_state_touches: parseInt(sharedStateInput?.value) || 0,
    cascade_impact_zones: parseInt(cascadeImpactInput?.value) || 0,
    subjectivity_rating: parseFloat(subjectivityInput?.value) || 0,
    loc_added: parseInt(locAddedInput?.value) || 0,
    loc_modified: parseInt(locModifiedInput?.value) || 0,
    test_cases_written: parseInt(testCasesInput?.value) || 0,
    edge_cases: parseInt(edgeCasesInput?.value) || 0,
    mocking_complexity: parseInt(mockingInput?.value) || 0,
    coordination_touchpoints: parseInt(coordinationInput?.value) || 0,
    review_rounds: parseInt(reviewRoundsInput?.value) || 0,
    blockers_encountered: parseInt(blockersInput?.value) || 0,
    // cie_score is omitted as it will be calculated on the server
  };
}

/**
 * Update the score display with the value from the server
 * @param {number} score - The score value from the server
 */
function updateScoreDisplay(score) {
  console.log('Updating score display with value:', score);

  if (!cieScore) {
    console.warn('Score element not found in DOM');
    return;
  }

  // Ensure score is a number
  const numericScore = parseFloat(score);
  if (isNaN(numericScore)) {
    console.warn('Invalid score value:', score);
    return;
  }

  // Update the score text
  cieScore.textContent = numericScore.toFixed(1);
  console.log('Score display updated to:', cieScore.textContent);

  // Update color based on score
  if (numericScore >= 70) {
    cieScore.className = 'cie-score high';
  } else if (numericScore >= 40) {
    cieScore.className = 'cie-score medium';
  } else {
    cieScore.className = 'cie-score low';
  }
}

// Export the module functions
export const ComplexityEngine = {
  initialize,
  loadComplexityData,
  resetComplexityData,
  getComplexityData,
  updateComplexityScore,
  updateScoreDisplay,
};
