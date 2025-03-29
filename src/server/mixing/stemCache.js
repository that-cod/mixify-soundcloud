
/**
 * Stem cache module
 * Handles caching logic for stem separation
 */

const path = require('path');
const fs = require('fs');
const { pathResolver } = require('../utils/systemUtils');

/**
 * Creates a cache directory if it doesn't exist
 * @returns {string} Path to the cache directory
 */
function ensureCacheDirectory() {
  const cacheDir = path.join(pathResolver.getUploadDir(), 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

/**
 * Generate cache path for stem file
 * @param {string} trackPath Path to original audio track
 * @param {string} prefix Prefix for the cache file
 * @returns {string} Path to cache file
 */
function generateStemCachePath(trackPath, prefix = 'track') {
  const cacheDir = ensureCacheDirectory();
  const fileName = path.basename(trackPath).split('.')[0];
  return path.join(cacheDir, `${prefix}_${fileName}_stems.json`);
}

/**
 * Read stems from cache if available
 * @param {string} cachePath Path to cache file
 * @returns {Object|null} Cached stems or null if not available
 */
function readStemsFromCache(cachePath) {
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
      console.log(`Using cached stems from ${path.basename(cachePath)}`);
      return cachedStems;
    } else {
      console.warn(`Some cached stems are missing, will regenerate`);
      return null;
    }
  } catch (cacheError) {
    console.warn(`Cache read failed for stems:`, cacheError.message);
    return null;
  }
}

/**
 * Write stems to cache
 * @param {string} cachePath Path to cache file
 * @param {Object} stemPaths Stem paths to cache
 * @returns {boolean} Success status
 */
function writeStemsToCache(cachePath, stemPaths) {
  if (!cachePath) {
    return false;
  }
  
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
  ensureCacheDirectory,
  generateStemCachePath,
  readStemsFromCache,
  writeStemsToCache
};
