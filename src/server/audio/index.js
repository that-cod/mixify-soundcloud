
/**
 * Audio processing module - Main entry point
 * Re-exports all functionality from specialized modules
 */

const { processAudio } = require('./processor');
const { analyzeAudio } = require('./analyzer');
const { separateTracks } = require('./stemSeparator');

module.exports = {
  processAudio,
  analyzeAudio,
  separateTracks
};
