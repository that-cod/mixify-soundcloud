
/**
 * Main mixing module
 * Coordinates the mixing process and integrates all sub-modules
 */

const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const { separateTracks } = require('../audio');
const { processStems } = require('./stemProcessor');
const { matchBPM } = require('./bpmMatcher');
const { mixProcessedStems } = require('./stemMixer');
const { applyFinalEffects } = require('./effectsProcessor');
const { cleanupTempFiles } = require('./utils');

/**
 * Mix two audio tracks together based on provided settings
 * @param {string} track1Path Path to the first audio track
 * @param {string} track2Path Path to the second audio track
 * @param {Object} settings Mixing settings
 * @param {string} outputPath Path for the output mixed file
 * @returns {Promise<Object>} Result of the mixing process
 */
async function mixTracks(track1Path, track2Path, settings, outputPath) {
  try {
    console.log('Starting mix process with settings:', settings);
    
    // Create temporary working directory
    const tempDir = path.join(path.dirname(outputPath), 'tmp', nanoid());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Default settings if none provided
    const mixSettings = {
      bpmMatch: true,
      keyMatch: true,
      vocalLevel1: 0.8,
      vocalLevel2: 0.5,
      beatLevel1: 0.6,
      beatLevel2: 0.8,
      crossfadeLength: 8,
      echo: 0.2,
      tempo: 0,
      ...settings
    };
    
    // Step 1: Separate stems for both tracks
    console.log('Separating stems for tracks...');
    const [track1Stems, track2Stems] = await Promise.all([
      separateTracks(track1Path),
      separateTracks(track2Path)
    ]);
    
    // Step 2: Process stems based on settings
    console.log('Processing stems...');
    const processedStems = await processStems(track1Stems, track2Stems, mixSettings, tempDir);
    
    // Step 3: Apply BPM matching if enabled
    if (mixSettings.bpmMatch) {
      console.log('Applying BPM matching...');
      await matchBPM(processedStems, mixSettings, tempDir);
    }
    
    // Step 4: Mix all processed stems together
    console.log('Mixing processed stems...');
    await mixProcessedStems(processedStems, mixSettings, outputPath);
    
    // Step 5: Apply final effects
    console.log('Applying final effects...');
    await applyFinalEffects(outputPath, mixSettings);
    
    // Clean up temporary files
    cleanupTempFiles(tempDir);
    
    return {
      success: true,
      outputPath,
      settings: mixSettings
    };
  } catch (error) {
    console.error('Mixing error:', error);
    throw new Error(`Failed to mix tracks: ${error.message}`);
  }
}

module.exports = {
  mixTracks
};
