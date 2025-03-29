
/**
 * Audio processing module - Main entry point
 * Re-exports all functionality from specialized modules
 */

const { processAudio, cleanupProcessedFiles, shouldUseLightMode, getAudioFileInfo } = require('./processor');
const { analyzeAudio, initAnalyzer } = require('./analyzer');
const { separateTracks, initStemSeparator } = require('./stemSeparator');
const { fileManager } = require('../utils/systemUtils');

/**
 * Initialize all audio processing modules
 * @returns {Promise<boolean>} True if initialization successful
 */
async function initAudioProcessing() {
  try {
    console.log('Initializing audio processing modules...');
    
    // Ensure all required directories exist
    fileManager.ensureDirectoriesExist();
    
    // Clean up any old temporary files
    fileManager.cleanupTempFiles();
    
    // Initialize analyzer
    await initAnalyzer();
    
    // Initialize stem separator
    await initStemSeparator();
    
    console.log('Audio processing modules initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing audio processing:', error);
    return false;
  }
}

module.exports = {
  initAudioProcessing,
  processAudio,
  analyzeAudio,
  separateTracks,
  cleanupProcessedFiles,
  shouldUseLightMode,
  getAudioFileInfo
};
