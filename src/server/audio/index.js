
/**
 * Audio processing module - Main entry point
 * Re-exports all functionality from specialized modules
 */

const { processAudio, cleanupProcessedFiles, shouldUseLightMode, getAudioFileInfo } = require('./processor');
const { analyzeAudio } = require('./analyzer');
const { separateTracks } = require('./stemSeparator');

module.exports = {
  processAudio,
  analyzeAudio,
  separateTracks,
  cleanupProcessedFiles,
  shouldUseLightMode,
  getAudioFileInfo
};
