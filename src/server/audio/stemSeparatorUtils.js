
/**
 * Stem separator utilities
 * Helper functions for stem separation process
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate that stem paths are correct and files exist
 * @param {Object} stemPaths Object containing paths to stems
 * @returns {boolean} True if all stem paths are valid
 */
function validateStemPaths(stemPaths) {
  if (!stemPaths || !stemPaths.vocals || !stemPaths.drums) {
    return false;
  }
  
  // Verify files exist
  for (const [type, stemPath] of Object.entries(stemPaths)) {
    if (!fs.existsSync(stemPath)) {
      console.warn(`Stem file missing: ${stemPath}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Read stems from cache if available
 * @param {string} cachePath Path to cache file
 * @returns {Object|null} Cached stems or null if not available
 */
function readStemCache(cachePath) {
  if (!cachePath || !fs.existsSync(cachePath)) {
    return null;
  }
  
  try {
    const cachedStems = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    
    // Verify all stem files exist
    const allStemsExist = Object.values(cachedStems).every(
      stemPath => fs.existsSync(stemPath)
    );
    
    if (allStemsExist) {
      console.log(`Using cached stems for ${path.basename(cachePath)}`);
      return cachedStems;
    } else {
      console.warn(`Some cached stems are missing, will regenerate`);
    }
  } catch (cacheError) {
    console.warn(`Cache read failed for stems:`, cacheError.message);
  }
  
  return null;
}

/**
 * Save stem paths to cache
 * @param {string} cachePath Path to cache file
 * @param {Object} stemPaths Object containing paths to stems
 * @returns {boolean} True if cache was written successfully
 */
function saveStemCache(cachePath, stemPaths) {
  try {
    const cacheDir = path.dirname(cachePath);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(stemPaths));
    console.log(`Cached stem paths to ${cachePath}`);
    return true;
  } catch (cacheError) {
    console.warn(`Failed to cache stem paths:`, cacheError.message);
    return false;
  }
}

module.exports = {
  validateStemPaths,
  readStemCache,
  saveStemCache
};
