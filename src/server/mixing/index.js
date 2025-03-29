
/**
 * Mixing Engine Module - Main entry point
 * Re-exports all functionality from specialized modules
 */

const { mixTracks } = require('./mixerCore');
const { convertWavToMp3 } = require('./mixerUtils');
const { optimizeSettings } = require('./settingsOptimizer');
const { processStems } = require('./stemProcessor');
const { createStemProcessingOptions } = require('./stemEnhancementOptions');
const { buildStemFilters } = require('./stemFilterBuilder');

module.exports = {
  // Main API
  mixTracks,
  convertWavToMp3,
  optimizeSettings,
  
  // Stem processing API
  processStems,
  createStemProcessingOptions,
  buildStemFilters
};
