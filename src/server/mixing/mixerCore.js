
/**
 * Mixer core module
 * Orchestrates the mixing process workflow
 */

const fs = require('fs');
const path = require('path');
const { shouldUseLightMode } = require('../audio/processor');
const { getSystemResources } = require('../utils/systemUtils');
const { cleanupTempFiles } = require('./utils');
const { processStems } = require('./stemProcessor');
const { matchBPM } = require('./bpmMatcher');
const { mixProcessedStems } = require('./stemMixer');
const { applyFinalEffects } = require('./effectsProcessor');
const { 
  createTempDirectory, 
  createDefaultSettings, 
  validateInputFiles,
  handleFileConversion 
} = require('./mixerUtils');
const { prepareStems } = require('./stemPreparation');

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
  const startTime = Date.now();
  
  try {
    console.log('Starting mix process with settings:', settings);
    
    // Step 1: Setup and validation
    track1Path = path.resolve(track1Path);
    track2Path = path.resolve(track2Path);
    outputPath = path.resolve(outputPath);
    
    // Validate input files
    validateInputFiles(track1Path, track2Path);
    
    // Check system resources and set optimization level
    const resources = getSystemResources();
    const lightMode = shouldUseLightMode() || resources.isLowResourceSystem;
    console.log(`System resources detected: ${resources.totalMemoryGB}GB RAM, ${resources.cpuCount} CPUs`);
    console.log(`Using ${lightMode ? 'light' : 'standard'} mixing mode`);
    
    // Create temporary directory
    tempDir = createTempDirectory(settings.tempDir);
    
    // Create default settings with proper mode
    const mixSettings = createDefaultSettings(settings, lightMode);
    
    // Log start of process with clear identifiers
    console.log(`=== Starting mix for tracks ===`);
    console.log(`Track 1: ${path.basename(track1Path)}`);
    console.log(`Track 2: ${path.basename(track2Path)}`);
    console.log(`Output: ${path.basename(outputPath)}`);
    console.log(`Temp dir: ${tempDir}`);
    console.log(`Mode: ${mixSettings.optimizationLevel}`);
    
    // Adjust quality settings based on optimization level
    if (mixSettings.optimizationLevel === 'light') {
      console.log('Using light optimization: some features may be simplified');
      // Simplify processing for light mode
      mixSettings.advancedProcessing = false;
      mixSettings.highQualityOutput = false;
      mixSettings.preserveDynamics = false;
      
      // Simplify BPM matching for light mode
      if (mixSettings.bpmMatch && Math.abs(mixSettings.tempo) > 0.2) {
        console.log('Limiting tempo adjustment in light mode');
        mixSettings.tempo = Math.sign(mixSettings.tempo) * 0.2;
      }
    }
    
    // Step 2: Separate stems for both tracks
    const { track1Stems, track2Stems } = await prepareStems(
      track1Path, 
      track2Path, 
      mixSettings, 
      tempDir
    );
    
    // Step 3: Process stems based on settings with enhanced quality
    console.log('Processing stems with enhanced quality...');
    let processedStems;
    try {
      processedStems = await processStems(track1Stems, track2Stems, mixSettings, tempDir);
    } catch (processingError) {
      console.error('Error during stem processing:', processingError);
      throw new Error(`Failed to process stems: ${processingError.message}`);
    }
    
    // Step 4: Apply BPM matching with improved algorithm if enabled
    if (mixSettings.bpmMatch && mixSettings.optimizationLevel !== 'ultra-light') {
      console.log('Applying enhanced BPM matching...');
      try {
        await matchBPM(processedStems, mixSettings, tempDir);
      } catch (bpmError) {
        console.error('Error during BPM matching:', bpmError);
        console.log('Continuing without BPM matching');
        // Continue despite BPM matching failure
      }
    }
    
    // Step 5: Mix all processed stems together with enhanced algorithms
    console.log('Mixing processed stems with enhanced quality...');
    const preMixPath = path.join(tempDir, 'pre_effects_mix.wav'); // Use WAV for better quality
    try {
      await mixProcessedStems(processedStems, mixSettings, preMixPath);
    } catch (mixingError) {
      console.error('Error during stem mixing:', mixingError);
      throw new Error(`Failed to mix stems: ${mixingError.message}`);
    }
    
    // Step 6: Apply final effects with advanced quality processing
    console.log('Applying enhanced final effects...');
    try {
      // Use high quality format for processing if enabled
      const useHighQuality = mixSettings.highQualityOutput && mixSettings.optimizationLevel !== 'light';
      const finalFormat = useHighQuality ? 'wav' : 'mp3';
      const finalBitrate = useHighQuality ? '1411k' : '320k';
      
      const effectsOptions = {
        format: finalFormat,
        bitrate: finalBitrate,
        sampleRate: useHighQuality ? 48000 : 44100,
        normalizeLoudness: mixSettings.normalizeLoudness,
        preserveDynamics: mixSettings.preserveDynamics,
        enhanceClarity: mixSettings.enhanceClarity,
        eqSettings: mixSettings.eqSettings
      };
      
      // Apply effects with quality settings
      await applyFinalEffects(preMixPath, outputPath, {
        ...mixSettings,
        ...effectsOptions
      });
      
      // Verify the output file exists
      if (!fs.existsSync(outputPath)) {
        throw new Error("Final output file was not created");
      }
    } catch (effectsError) {
      console.error('Error applying final effects:', effectsError);
      
      // Fallback - if effects failed, try to use the pre-effects mix
      const preEffectsPath = path.join(tempDir, 'pre_effects_mix.wav');
      if (fs.existsSync(preEffectsPath)) {
        console.log('Using pre-effects mix as fallback');
        await handleFileConversion(preEffectsPath, outputPath);
      } else {
        throw new Error(`Failed to apply effects and no fallback available: ${effectsError.message}`);
      }
    }
    
    // Calculate processing time
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Successful completion
    console.log(`=== Mix completed successfully in ${processingTime} seconds ===`);
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
      optimizationLevel: mixSettings.optimizationLevel,
      processingTime: parseFloat(processingTime)
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
