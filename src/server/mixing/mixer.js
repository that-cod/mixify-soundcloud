
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
const { shouldUseLightMode } = require('../audio/processor');
const os = require('os');

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
    
    // Check system resources and set optimization level
    const lightMode = shouldUseLightMode();
    console.log(`System resources detected: using ${lightMode ? 'light' : 'standard'} mode`);
    
    // Create temporary working directory - use system temp if available
    const tempBaseDir = settings.tempDir || os.tmpdir();
    const tempDir = path.join(tempBaseDir, 'mixify-tmp', nanoid());
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
      optimizationLevel: lightMode ? 'light' : 'standard',
      ...settings
    };
    
    // Limit features based on optimization level
    if (mixSettings.optimizationLevel === 'light') {
      console.log('Using light optimization: some features may be simplified');
      // Simplify BPM matching for light mode
      if (mixSettings.bpmMatch && Math.abs(mixSettings.tempo) > 0.2) {
        console.log('Limiting tempo adjustment in light mode');
        mixSettings.tempo = Math.sign(mixSettings.tempo) * 0.2;
      }
    }
    
    // Create unique cache directories for stems
    const track1StemCachePath = path.join(tempDir, 'cache', `track1_stems.json`);
    const track2StemCachePath = path.join(tempDir, 'cache', `track2_stems.json`);
    
    // Step 1: Separate stems for both tracks
    console.log('Separating stems for tracks...');
    const [track1Stems, track2Stems] = await Promise.all([
      separateTracks(track1Path, {
        outputDir: path.join(tempDir, 'track1'),
        lightMode: mixSettings.optimizationLevel === 'light',
        cachePath: track1StemCachePath
      }),
      separateTracks(track2Path, {
        outputDir: path.join(tempDir, 'track2'),
        lightMode: mixSettings.optimizationLevel === 'light',
        cachePath: track2StemCachePath
      })
    ]);
    
    // Step 2: Process stems based on settings
    console.log('Processing stems...');
    const processedStems = await processStems(track1Stems, track2Stems, mixSettings, tempDir);
    
    // Step 3: Apply BPM matching if enabled and not in extremely light mode
    if (mixSettings.bpmMatch && mixSettings.optimizationLevel !== 'ultra-light') {
      console.log('Applying BPM matching...');
      await matchBPM(processedStems, mixSettings, tempDir);
    }
    
    // Step 4: Mix all processed stems together
    console.log('Mixing processed stems...');
    await mixProcessedStems(processedStems, mixSettings, outputPath);
    
    // Step 5: Apply final effects - reduce effects complexity in light mode
    console.log('Applying final effects...');
    if (mixSettings.optimizationLevel === 'light') {
      // Simplify effects for performance
      const lightEffectsSettings = { ...mixSettings };
      if (lightEffectsSettings.echo > 0.3) {
        lightEffectsSettings.echo = 0.3;
      }
      await applyFinalEffects(outputPath, lightEffectsSettings);
    } else {
      await applyFinalEffects(outputPath, mixSettings);
    }
    
    // Clean up temporary files
    if (!settings.keepTempFiles) {
      cleanupTempFiles(tempDir);
    }
    
    return {
      success: true,
      outputPath,
      settings: mixSettings,
      optimizationLevel: mixSettings.optimizationLevel
    };
  } catch (error) {
    console.error('Mixing error:', error);
    throw new Error(`Failed to mix tracks: ${error.message}`);
  }
}

module.exports = {
  mixTracks
};
