
/**
 * Utility functions for the mixing engine
 */

const fs = require('fs');
const path = require('path');

/**
 * Clean up temporary files
 * @param {string} tempDir Temporary directory
 */
function cleanupTempFiles(tempDir) {
  try {
    if (fs.existsSync(tempDir)) {
      fs.readdirSync(tempDir).forEach(file => {
        const filePath = path.join(tempDir, file);
        fs.unlinkSync(filePath);
      });
      fs.rmdirSync(tempDir);
    }
  } catch (error) {
    console.warn('Error cleaning up temp files:', error);
  }
}

module.exports = {
  cleanupTempFiles
};
