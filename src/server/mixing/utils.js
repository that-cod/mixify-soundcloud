
/**
 * Mixing utilities module
 * Handles auxiliary operations for the mixing process
 */

const fs = require('fs');
const path = require('path');

/**
 * Clean up temporary files after mixing
 * @param {string} tempDir Directory to clean up
 * @returns {void}
 */
function cleanupTempFiles(tempDir) {
  if (!tempDir || !fs.existsSync(tempDir)) {
    return;
  }
  
  try {
    // Recursively remove the directory
    removeDirectoryRecursive(tempDir);
    console.log(`Cleaned up temporary directory: ${tempDir}`);
  } catch (error) {
    console.warn(`Failed to clean up temp directory ${tempDir}:`, error);
  }
}

/**
 * Recursively remove a directory
 * @param {string} dirPath Directory path to remove
 * @returns {void}
 */
function removeDirectoryRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        removeDirectoryRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    
    // Remove empty directory
    fs.rmdirSync(dirPath);
  }
}

/**
 * Get file size in MB
 * @param {string} filePath Path to the file
 * @returns {number} File size in MB
 */
function getFileSizeMB(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
  } catch (error) {
    console.warn(`Failed to get file size for ${filePath}:`, error);
    return 0;
  }
}

/**
 * Check if a file exists and is readable
 * @param {string} filePath Path to the file
 * @returns {boolean} True if file exists and is readable
 */
function isFileReadable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a temporary file path
 * @param {string} baseDir Base directory
 * @param {string} extension File extension
 * @returns {string} Temporary file path
 */
function generateTempFilePath(baseDir, extension = 'mp3') {
  const { nanoid } = require('nanoid');
  const id = nanoid(10);
  return path.join(baseDir, `temp_${id}.${extension}`);
}

module.exports = {
  cleanupTempFiles,
  getFileSizeMB,
  isFileReadable,
  generateTempFilePath
};
