
/**
 * Workflow orchestrator module
 * Manages the high-level mixing process workflow
 */

const fs = require('fs');
const path = require('path');
const { prepareStems } = require('./stemPreparation');
const { processStems } = require('./stemProcessor');
const { matchBPM } = require('./bpmMatcher');
const { mixProcessedStems } = require('./stemMixer');
const { applyFinalEffects } = require('./effectsProcessor');
const { 
  createTempDirectory, 
  validateInputFiles,
  handleFileConversion 
} = require('./mixerUtils');
const { cleanupTempFiles } = require('./utils');

/**
 * Execute the mixing workflow with proper orchestration
 * @param {string} track1Path Path to first track
 * @param {string} track2Path Path to second track
 * @param {Object} mixSettings Mix settings object
 * @param {string} outputPath Output path for mixed file
 * @param {string} tempDir Temporary directory
 * @returns {Promise<Object>} Result information
 */
async function executeMixingWorkflow(track1Path, track2Path, mixSettings, outputPath, tempDir) {
  const startTime = Date.now();
  
  try {
    // Step 1: Separate stems for both tracks
    const { track1Stems, track2Stems } = await prepareStems(
      track1Path, 
      track2Path, 
      mixSettings, 
      tempDir
    );
    
    // Step 2: Process stems based on settings with enhanced quality
    console.log('Processing stems with enhanced quality...');
    let processedStems;
    try {
      processedStems = await processStems(track1Stems, track2Stems, mixSettings, tempDir);
    } catch (processingError) {
      console.error('Error during stem processing:', processingError);
      throw new Error(`Failed to process stems: ${processingError.message}`);
    }
    
    // Step 3: Apply BPM matching with improved algorithm if enabled
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
    
    // Step 4: Mix all processed stems together with enhanced algorithms
    console.log('Mixing processed stems with enhanced quality...');
    const preMixPath = path.join(tempDir, 'pre_effects_mix.wav'); // Use WAV for better quality
    try {
      await mixProcessedStems(processedStems, mixSettings, preMixPath);
    } catch (mixingError) {
      console.error('Error during stem mixing:', mixingError);
      throw new Error(`Failed to mix stems: ${mixingError.message}`);
    }
    
    // Step 5: Apply final effects with advanced quality processing
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
    
    // Return success information
    return {
      success: true,
      outputPath,
      processingTime: parseFloat(processingTime)
    };
  } catch (error) {
    console.error('Workflow execution error:', error);
    throw error;
  }
}

module.exports = {
  executeMixingWorkflow
};
