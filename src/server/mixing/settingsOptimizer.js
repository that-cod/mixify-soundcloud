
/**
 * Settings optimizer module
 * Handles the preparation and optimization of mix settings
 */

const { getSystemResources } = require('../utils/systemUtils');
const { shouldUseLightMode } = require('../audio/processor');
const { createDefaultSettings } = require('./mixerUtils');

/**
 * Prepare and optimize mix settings based on system resources
 * @param {Object} settings User provided settings
 * @returns {Object} Optimized settings
 */
function optimizeSettings(settings = {}) {
  // Check system resources and set optimization level
  const resources = getSystemResources();
  const lightMode = shouldUseLightMode() || resources.isLowResourceSystem;
  console.log(`System resources detected: ${resources.totalMemoryGB}GB RAM, ${resources.cpuCount} CPUs`);
  console.log(`Using ${lightMode ? 'light' : 'standard'} mixing mode`);
  
  // Create default settings with proper mode
  const mixSettings = createDefaultSettings(settings, lightMode);
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
  
  return mixSettings;
}

module.exports = {
  optimizeSettings
};
