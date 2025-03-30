
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
  let tempDir = null;
  const startTime = Date.now();
  const systemInfo = getSystemInfo();
  
  try {
    console.log('Starting mix process with settings:', settings);
    console.log('System info:', systemInfo);
    
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
    
    // Calculate processing time
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Log completion
    console.log(`=== Mix completed successfully in ${processingTime} seconds ===`);
    console.log(`Output file: ${outputPath}`);
    
    // Check output file size
    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`Output file size: ${fileSizeMB} MB`);
    
    // Clean up temporary files
    if (!settings.keepTempFiles) {
      console.log('Cleaning up temporary files...');
      try {
        cleanupTempFiles(tempDir);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp files:', cleanupError);
      }
    }
    
    // Return detailed information about the mix
    return {
      success: true,
      outputPath,
      settings: mixSettings,
      optimizationLevel: mixSettings.optimizationLevel,
      processingTime: parseFloat(processingTime),
      systemInfo: systemInfo,
      outputFileSize: parseFloat(fileSizeMB),
      stemSeparationMethod: result.stemSeparationMethod || 'standard'
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

/**
 * Get current system information for diagnostics
 * @returns {Object} System information
 */
function getSystemInfo() {
  try {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + 'GB',
      freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + 'GB',
      nodeVersion: process.version
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      error: 'Could not retrieve system information'
    };
  }
}

module.exports = {
  mixTracks
};
