/**
 * Epic Tracker Package.json Utilities
 * Handles updating the user's package.json file
 */

const fs = require('fs');
const path = require('path');

/**
 * Update the user's package.json file
 */
function updatePackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  // Check if package.json exists
  if (!fs.existsSync(packageJsonPath)) {
    console.warn('package.json not found. Skipping package.json update.');
    return;
  }
  
  try {
    // Read the package.json file
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Initialize scripts object if it doesn't exist
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Check if the script already exists
    if (packageJson.scripts['epic-tracker']) {
      console.log('epic-tracker script already exists in package.json');
    } else {
      // Add the epic-tracker script
      packageJson.scripts['epic-tracker'] = 'epic-tracker start';
      
      // Write the updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('Added epic-tracker script to package.json');
    }
  } catch (error) {
    console.error('Error updating package.json:', error.message);
    process.exit(1);
  }
}

module.exports = {
  updatePackageJson
};