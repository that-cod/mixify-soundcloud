
/**
 * Stem separator utility functions
 */

const fs = require('fs');
const path = require('path');
const { runPythonScriptWithProgress } = require('../pythonBridge');

/**
 * Validate that all stem paths exist
 * @param {Object} stemPaths Object containing paths to stem files
 * @returns {boolean} True if all paths exist
 */
function validateStemPaths(stemPaths) {
  if (!stemPaths || typeof stemPaths !== 'object') {
    console.error('validateStemPaths: Invalid stem paths object', stemPaths);
    return false;
  }
  
  const requiredStems = ['vocals', 'drums', 'bass', 'other'];
  
  // Check if all required stems exist in the object
  const hasAllKeys = requiredStems.every(stem => stem in stemPaths);
  if (!hasAllKeys) {
    console.error('validateStemPaths: Missing required stems', {
      required: requiredStems,
      provided: Object.keys(stemPaths)
    });
    return false;
  }
  
  // Check if all stem files exist
  let allExist = true;
  for (const [stem, path] of Object.entries(stemPaths)) {
    if (!fs.existsSync(path)) {
      console.error(`validateStemPaths: Stem file not found: ${stem} at ${path}`);
      allExist = false;
    }
  }
  
  return allExist;
}

/**
 * Save stem cache to disk
 * @param {string} cachePath Path to save cache
 * @param {Object} stemPaths Stem paths to cache
 */
function saveStemCache(cachePath, stemPaths) {
  try {
    // Create directory if it doesn't exist
    const cacheDir = path.dirname(cachePath);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    // Create cache entry
    const cacheEntry = {
      stems: stemPaths,
      timestamp: Date.now()
    };
    
    fs.writeFileSync(cachePath, JSON.stringify(cacheEntry), 'utf8');
    console.log(`Saved stem cache to ${cachePath}`);
  } catch (error) {
    console.error('Error saving stem cache:', error);
    // Non-critical error, just log it
  }
}

/**
 * Read stem cache from disk
 * @param {string} cachePath Path to read cache from
 * @returns {Object|null} Stem paths from cache, or null if not found/invalid
 */
function readStemCache(cachePath) {
  try {
    if (!fs.existsSync(cachePath)) {
      return null;
    }
    
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    
    // Validate cache data
    if (!cacheData.stems || !cacheData.timestamp) {
      return null;
    }
    
    // Check if cached stem files still exist
    if (!validateStemPaths(cacheData.stems)) {
      console.log('Cached stem files no longer exist');
      return null;
    }
    
    // Check if cache is too old (more than 7 days)
    const cacheAge = Date.now() - cacheData.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    if (cacheAge > maxAge) {
      console.log('Stem cache is too old, ignoring');
      return null;
    }
    
    console.log(`Using cached stems from ${cachePath}`);
    return cacheData.stems;
  } catch (error) {
    console.error('Error reading stem cache:', error);
    return null;
  }
}

/**
 * Check if Python libraries are installed correctly
 * @returns {Promise<Object>} Status of library installation
 */
async function checkPythonLibraries() {
  try {
    const result = await runPythonScriptWithProgress('check_libraries.py', []);
    return JSON.parse(result);
  } catch (error) {
    console.error('Error checking Python libraries:', error);
    return {
      error: error.message,
      librariesAvailable: false
    };
  }
}

module.exports = {
  validateStemPaths,
  saveStemCache,
  readStemCache,
  checkPythonLibraries
};
