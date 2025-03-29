
/**
 * Mixing filters module
 * Handles the creation of complex audio filters for the mixing process
 */

/**
 * Create complex filter for stem mixing
 * @param {Array<string>} stemLabels Labels for each stem
 * @param {number} stemCount Number of stems to mix
 * @param {Object} settings Mixing settings
 * @param {boolean} useHighQuality Whether to use high quality processing
 * @returns {string} Complex filter string for FFmpeg
 */
function createMixingFilter(stemLabels, stemCount, settings, useHighQuality) {
  // Add advanced crossfade and mixing options
  const crossfadeLength = Math.max(1, Math.min(20, settings.crossfadeLength || 8));
  
  let filter = '';
  
  // Create the final mix with enhanced settings
  if (settings.optimizationLevel !== 'light' && useHighQuality) {
    // Advanced mixing with stem weighting and crossfading
    filter += stemLabels.join('') + `amix=inputs=${stemCount}:dropout_transition=${crossfadeLength}`;
    
    // Add dynamic processing based on settings
    if (settings.enhanceClarity) {
      filter += ':weights="1 1 1 1 1 1 1 1"'; // Equal weighting for all stems
    }
    
    filter += '[mixed];';
    
    // Add final EQ and dynamics processing for better blend
    filter += '[mixed]equalizer=f=100:width_type=h:width=200:g=1,';
    filter += 'equalizer=f=3000:width_type=h:width=2000:g=1,';
    filter += 'acompressor=threshold=-12dB:ratio=2:attack=200:release=1000:makeup=1';
    
    // Add stereo widening for spaciousness if enabled
    if (settings.optimizationLevel === 'standard') {
      filter += ',stereotools=mlev=0.15';
    }
    
    filter += '[out]';
  } else {
    // Simpler mixing for light mode
    filter += stemLabels.join('') + `amix=inputs=${stemCount}:dropout_transition=${crossfadeLength}[out]`;
  }
  
  return filter;
}

/**
 * Prepare input filter chain for volume adjustments
 * @param {number} stemCount Total number of stems
 * @param {Object} processedStems Stem files by track and type
 * @returns {Object} Filter setup with labels and initial filters
 */
function prepareInputFilters(stemCount, processedStems) {
  let filter = '';
  let stemLabels = [];
  let currentStemCount = 0;
  
  // Add all track1 stems with specific volume adjustments
  Object.entries(processedStems.track1).forEach(([stemType, stemPath]) => {
    const stemLabel = `t1_${stemType}`;
    filter += `[${currentStemCount}:a]volume=1[${stemLabel}];`;
    stemLabels.push(`[${stemLabel}]`);
    currentStemCount++;
  });
  
  // Add all track2 stems with specific volume adjustments
  Object.entries(processedStems.track2).forEach(([stemType, stemPath]) => {
    const stemLabel = `t2_${stemType}`;
    filter += `[${currentStemCount}:a]volume=1[${stemLabel}];`;
    stemLabels.push(`[${stemLabel}]`);
    currentStemCount++;
  });
  
  return { filter, stemLabels, currentStemCount };
}

module.exports = {
  createMixingFilter,
  prepareInputFilters
};
