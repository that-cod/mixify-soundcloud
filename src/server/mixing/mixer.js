
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
const config = require('../config');

/**
 * Mix two audio tracks together based on provided settings
 * @param {string} track1Path Path to the first audio track
 * @param {string} track2Path Path to the second audio track
 * @param {Object} settings Mixing settings
 * @param {string} outputPath Path for the output mixed file
 * @returns {Promise<Object>} Result of the mixing process
 */
async function mixTracks(track1Path, track2Path, settings, outputPath) {
  let tempDir = null;
  
  try {
    console.log('Starting mix process with settings:', settings);
    
    // Validate input files exist
    if (!fs.existsSync(track1Path)) {
      throw new Error(`Track 1 file not found: ${track1Path}`);
    }
    
    if (!fs.existsSync(track2Path)) {
      throw new Error(`Track 2 file not found: ${track2Path}`);
    }
    
    // Check system resources and set optimization level
    const lightMode = shouldUseLightMode();
    console.log(`System resources detected: using ${lightMode ? 'light' : 'standard'} mode`);
    
    // Create temporary working directory - use system temp if available
    const tempBaseDir = settings.tempDir || config.fileStorage.tempDir || os.tmpdir();
    tempDir = path.join(tempBaseDir, 'mixify-tmp', nanoid());
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
    
    // Log start of process with clear identifiers
    console.log(`=== Starting mix for tracks ===`);
    console.log(`Track 1: ${path.basename(track1Path)}`);
    console.log(`Track 2: ${path.basename(track2Path)}`);
    console.log(`Output: ${path.basename(outputPath)}`);
    console.log(`Temp dir: ${tempDir}`);
    console.log(`Mode: ${mixSettings.optimizationLevel}`);
    
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
    const track1StemCachePath = path.join(config.fileStorage.uploadDir, 'cache', `track1_${path.basename(track1Path).split('.')[0]}_stems.json`);
    const track2StemCachePath = path.join(config.fileStorage.uploadDir, 'cache', `track2_${path.basename(track2Path).split('.')[0]}_stems.json`);
    
    // Step 1: Separate stems for both tracks
    console.log('Separating stems for tracks...');
    let track1Stems, track2Stems;
    
    try {
      [track1Stems, track2Stems] = await Promise.all([
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
    } catch (separationError) {
      console.error('Error during stem separation:', separationError);
      throw new Error(`Failed to separate stems: ${separationError.message}`);
    }
    
    // Step 2: Process stems based on settings
    console.log('Processing stems...');
    let processedStems;
    try {
      processedStems = await processStems(track1Stems, track2Stems, mixSettings, tempDir);
    } catch (processingError) {
      console.error('Error during stem processing:', processingError);
      throw new Error(`Failed to process stems: ${processingError.message}`);
    }
    
    // Step 3: Apply BPM matching if enabled and not in extremely light mode
    if (mixSettings.bpmMatch && mixSettings.optimizationLevel !== 'ultra-light') {
      console.log('Applying BPM matching...');
      try {
        await matchBPM(processedStems, mixSettings, tempDir);
      } catch (bpmError) {
        console.error('Error during BPM matching:', bpmError);
        console.log('Continuing without BPM matching');
        // Continue despite BPM matching failure
      }
    }
    
    // Step 4: Mix all processed stems together
    console.log('Mixing processed stems...');
    try {
      await mixProcessedStems(processedStems, mixSettings, path.join(tempDir, 'pre_effects_mix.mp3'));
    } catch (mixingError) {
      console.error('Error during stem mixing:', mixingError);
      throw new Error(`Failed to mix stems: ${mixingError.message}`);
    }
    
    // Step 5: Apply final effects - reduce effects complexity in light mode
    console.log('Applying final effects...');
    try {
      // Adjust effects settings for light mode
      if (mixSettings.optimizationLevel === 'light') {
        // Simplify effects for performance
        const lightEffectsSettings = { ...mixSettings };
        if (lightEffectsSettings.echo > 0.3) {
          lightEffectsSettings.echo = 0.3;
        }
        await applyFinalEffects(path.join(tempDir, 'pre_effects_mix.mp3'), outputPath, lightEffectsSettings);
      } else {
        await applyFinalEffects(path.join(tempDir, 'pre_effects_mix.mp3'), outputPath, mixSettings);
      }
      
      // Verify the output file exists
      if (!fs.existsSync(outputPath)) {
        throw new Error("Final output file was not created");
      }
    } catch (effectsError) {
      console.error('Error applying final effects:', effectsError);
      
      // Fallback - if effects failed, try to use the pre-effects mix
      const preEffectsPath = path.join(tempDir, 'pre_effects_mix.mp3');
      if (fs.existsSync(preEffectsPath)) {
        console.log('Using pre-effects mix as fallback');
        fs.copyFileSync(preEffectsPath, outputPath);
      } else {
        throw new Error(`Failed to apply effects and no fallback available: ${effectsError.message}`);
      }
    }
    
    // Successful completion
    console.log(`=== Mix completed successfully ===`);
    console.log(`Output file: ${outputPath}`);
    
    // Clean up temporary files
    if (!settings.keepTempFiles) {
      console.log('Cleaning up temporary files...');
      try {
        cleanupTempFiles(tempDir);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp files:', cleanupError);
      }
    }
    
    return {
      success: true,
      outputPath,
      settings: mixSettings,
      optimizationLevel: mixSettings.optimizationLevel
    };
  } catch (error) {
    console.error('Mixing error:', error);
    
    // Additional detailed error logging
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    // Clean up temporary files on error
    if (tempDir && fs.existsSync(tempDir) && !settings.keepTempFiles) {
      try {
        cleanupTempFiles(tempDir);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp files after error:', cleanupError);
      }
    }
    
    throw new Error(`Failed to mix tracks: ${error.message}`);
  }
}

module.exports = {
  mixTracks
};
