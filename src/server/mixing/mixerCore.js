
/**
 * Mixer core module
 * Orchestrates the mixing process workflow
 */

const fs = require('fs');
const path = require('path');
const { createTempDirectory, validateInputFiles } = require('./mixerUtils');
const { optimizeSettings } = require('./settingsOptimizer');
const { executeMixingWorkflow } = require('./workflowOrchestrator');
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
  let tempDir = null;
  
  try {
    console.log('Starting mix process with settings:', settings);
    
    // Step 1: Setup and validation
    track1Path = path.resolve(track1Path);
    track2Path = path.resolve(track2Path);
    outputPath = path.resolve(outputPath);
    
    // Validate input files
    validateInputFiles(track1Path, track2Path);
    
    // Create temporary directory
    tempDir = createTempDirectory(settings.tempDir);
    
    // Optimize settings based on system capabilities
    const mixSettings = optimizeSettings(settings);
    
    // Log start of process with clear identifiers
    console.log(`=== Starting mix for tracks ===`);
    console.log(`Track 1: ${path.basename(track1Path)}`);
    console.log(`Track 2: ${path.basename(track2Path)}`);
    console.log(`Output: ${path.basename(outputPath)}`);
    console.log(`Temp dir: ${tempDir}`);
    
    // Execute the mixing workflow
    const result = await executeMixingWorkflow(
      track1Path,
      track2Path,
      mixSettings,
      outputPath,
      tempDir
    );
    
    // Log completion
    console.log(`=== Mix completed successfully in ${result.processingTime} seconds ===`);
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
      processingTime: result.processingTime
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
