/**
 * mcptix Browser Utilities
 * Handles opening the browser to the mcptix UI
 */

const open = require('open');

/**
 * Open the browser to the specified URL
 * @param {string} url The URL to open
 */
async function openBrowser(url) {
  try {
    console.log(`Opening browser to ${url}`);
    await open(url);
  } catch (error) {
    console.error('Error opening browser:', error.message);
    console.log(`Please open your browser manually and navigate to ${url}`);
  }
}

module.exports = {
  openBrowser,
};
