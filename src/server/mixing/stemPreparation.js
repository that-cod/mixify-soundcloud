
/**
 * Stem preparation module
 * Handles stem separation with caching support
 */

const path = require('path');
const fs = require('fs');
const { separateTracks } = require('../audio');
const { 
  generateStemCachePath, 
  readStemsFromCache,
  writeStemsToCache
} = require('./stemCache');

/**
 * Create output directories for stems
 * @param {string} tempDir Base temporary directory
 * @returns {Object} Object with paths to track directories
 */
function createStemDirectories(tempDir) {
  const track1Dir = path.join(tempDir, 'track1');
  const track2Dir = path.join(tempDir, 'track2');
  
  if (!fs.existsSync(track1Dir)) {
    fs.mkdirSync(track1Dir, { recursive: true });
  }
  
  if (!fs.existsSync(track2Dir)) {
    fs.mkdirSync(track2Dir, { recursive: true });
  }
  
  return { track1Dir, track2Dir };
}

/**
 * Process individual track to separate stems
 * @param {string} trackPath Path to audio track
 * @param {string} outputDir Output directory for stems
 * @param {Object} settings Mixing settings
 * @param {string} cachePrefix Prefix for cache files
 * @returns {Promise<Object>} Object containing stem paths
 */
async function processTrackStems(trackPath, outputDir, settings, cachePrefix) {
  // Generate cache path and check if we have cached stems
  const cachePath = generateStemCachePath(trackPath, cachePrefix);
  const cachedStems = readStemsFromCache(cachePath);
  
  if (cachedStems) {
    return cachedStems;
  }
  
  // Configure separation options
  const separationOptions = {
    outputDir: outputDir,
    lightMode: settings.optimizationLevel === 'light',
    highQuality: settings.highQualityOutput,
    useCache: true,
    cachePath: cachePath
  };
  
  // Separate stems
  const stems = await separateTracks(trackPath, separationOptions);
  
  // Verify we have valid stems
  if (!stems) {
    throw new Error(`Stem separation failed for ${path.basename(trackPath)}`);
  }
  
  // Verify all required stem types exist
  const requiredStems = ['vocals', 'drums', 'bass', 'other'];
  for (const stem of requiredStems) {
    if (!stems[stem]) {
      throw new Error(`Missing ${stem} stem for ${path.basename(trackPath)}`);
    }
  }
  
  // Cache the results
  writeStemsToCache(cachePath, stems);
  
  return stems;
}

/**
 * Prepare stems for both tracks with caching support
 * @param {string} track1Path Path to first audio track
 * @param {string} track2Path Path to second audio track
 * @param {Object} settings Mixing settings
 * @param {string} tempDir Temporary directory
 * @returns {Promise<Object>} Object containing stems for both tracks
 */
async function prepareStems(track1Path, track2Path, settings, tempDir) {
  try {
    // Create output directories
    const { track1Dir, track2Dir } = createStemDirectories(tempDir);
    
    console.log('Separating stems for tracks...');
    
    // Process both tracks in parallel
    const [track1Stems, track2Stems] = await Promise.all([
      processTrackStems(track1Path, track1Dir, settings, 'track1'),
      processTrackStems(track2Path, track2Dir, settings, 'track2')
    ]);
    
    return { track1Stems, track2Stems };
  } catch (separationError) {
    console.error('Error during stem separation:', separationError);
    throw new Error(`Failed to separate stems: ${separationError.message}`);
  }
}

module.exports = {
  prepareStems,
  processTrackStems, // Export for testing or advanced use cases
  createStemDirectories // Export for testing
};
