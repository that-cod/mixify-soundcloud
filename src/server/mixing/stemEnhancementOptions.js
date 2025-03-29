
/**
 * Stem enhancement options module
 * Defines processing options for different stem types
 */

/**
 * Create stem-specific processing options
 * @param {Object} settings Mixing settings
 * @returns {Object} Stem-specific processing options
 */
function createStemProcessingOptions(settings) {
  return {
    // Enhanced vocal processing
    vocals: {
      highPass: true, // Remove low frequencies
      highPassFreq: 100, // High pass filter at 100Hz
      compression: true, // Apply compression
      compThreshold: -20, // Compression threshold
      compRatio: 3, // Compression ratio
      clarity: settings.enhanceClarity !== false, // Enhance clarity
      normalize: settings.normalizeLoudness !== false // Normalize loudness
    },
    // Enhanced drum processing
    drums: {
      lowPass: true, // Keep low frequencies
      lowPassFreq: 12000, // Low pass filter at 12kHz
      compression: true, // Apply compression
      compThreshold: -15, // Compression threshold
      compRatio: 4, // Compression ratio
      enhance: settings.optimizationLevel !== 'light' // Enhance drums
    },
    // Enhanced bass processing
    bass: {
      lowPass: true, // Keep low frequencies
      lowPassFreq: 5000, // Low pass filter at 5kHz
      compression: true, // Apply compression 
      compThreshold: -20, // Compression threshold
      compRatio: 5, // Compression ratio
      enhance: settings.optimizationLevel !== 'light' // Enhance bass
    },
    // Enhanced other processing
    other: {
      bandPass: true, // Band pass filter
      bandPassLow: 200, // Band pass lower bound
      bandPassHigh: 10000, // Band pass upper bound
      compression: true, // Apply compression
      compThreshold: -25, // Compression threshold
      compRatio: 2.5, // Compression ratio
      enhance: settings.optimizationLevel !== 'light' // Enhance other
    }
  };
}

module.exports = {
  createStemProcessingOptions
};
