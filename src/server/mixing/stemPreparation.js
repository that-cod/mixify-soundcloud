
/**
 * Stem preparation module
 * Handles stem separation and caching logic
 */

const path = require('path');
const fs = require('fs');
const { pathResolver } = require('../utils/systemUtils');
const { separateTracks } = require('../audio');

/**
 * Prepare stems for both tracks with caching support
 * @param {string} track1Path Path to first audio track
 * @param {string} track2Path Path to second audio track
 * @param {Object} settings Mixing settings
 * @param {string} tempDir Temporary directory
 * @returns {Promise<Object>} Object containing stems for both tracks
 */
async function prepareStems(track1Path, track2Path, settings, tempDir) {
  // Create unique cache directories for stems
  const cacheDir = path.join(pathResolver.getUploadDir(), 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  const track1StemCachePath = path.join(cacheDir, `track1_${path.basename(track1Path).split('.')[0]}_stems.json`);
  const track2StemCachePath = path.join(cacheDir, `track2_${path.basename(track2Path).split('.')[0]}_stems.json`);
  
  console.log('Separating stems for tracks...');
  let track1Stems, track2Stems;
  
  try {
    const separationOptions = {
      outputDir: tempDir,
      lightMode: settings.optimizationLevel === 'light',
      highQuality: settings.highQualityOutput,
      useCache: true
    };
    
    [track1Stems, track2Stems] = await Promise.all([
      separateTracks(track1Path, {
        ...separationOptions,
        outputDir: path.join(tempDir, 'track1'),
        cachePath: track1StemCachePath
      }),
      separateTracks(track2Path, {
        ...separationOptions,
        outputDir: path.join(tempDir, 'track2'),
        cachePath: track2StemCachePath
      })
    ]);
    
    // Verify we have valid stems
    if (!track1Stems || !track2Stems) {
      throw new Error("Stem separation failed for one or both tracks");
    }
    
    // Check that all required stem types exist
    const requiredStems = ['vocals', 'drums', 'bass', 'other'];
    for (const stem of requiredStems) {
      if (!track1Stems[stem] || !track2Stems[stem]) {
        throw new Error(`Missing ${stem} stem for one or both tracks`);
      }
    }
    
    return { track1Stems, track2Stems };
  } catch (separationError) {
    console.error('Error during stem separation:', separationError);
    throw new Error(`Failed to separate stems: ${separationError.message}`);
  }
}

module.exports = {
  prepareStems
};
