
/**
 * Stem filter builder module
 * Creates audio filters for different stem types
 */

/**
 * Build audio filters for a specific stem type
 * @param {string} stemType Type of stem (vocals, drums, bass, other)
 * @param {Object} stemOptions Processing options for this stem type
 * @param {number} volumeLevel Volume level to apply
 * @param {boolean} useHighQuality Whether to use high quality processing
 * @returns {Object} Filter configuration object
 */
function buildStemFilters(stemType, stemOptions, volumeLevel, useHighQuality) {
  // Build audio filters array
  const filters = [];
  
  // Apply volume adjustment
  filters.push(`volume=${volumeLevel}`);
  
  // Apply high pass filter for vocals
  if (stemType === 'vocals' && stemOptions.highPass) {
    filters.push(`highpass=f=${stemOptions.highPassFreq}`);
  }
  
  // Apply low pass filter for drums and bass
  if ((stemType === 'drums' || stemType === 'bass') && stemOptions.lowPass) {
    filters.push(`lowpass=f=${stemOptions.lowPassFreq}`);
  }
  
  // Apply band pass filter for other
  if (stemType === 'other' && stemOptions.bandPass) {
    filters.push(`bandpass=f=2000:width_type=h:width=8000`);
  }
  
  // Apply compression if enabled
  if (stemOptions.compression) {
    filters.push(`acompressor=threshold=${stemOptions.compThreshold}dB:ratio=${stemOptions.compRatio}:attack=20:release=250`);
  }
  
  // Apply stem-specific enhancements
  if (stemOptions.enhance) {
    if (stemType === 'vocals' && stemOptions.clarity) {
      // Add vocal clarity enhancement
      filters.push('equalizer=f=3000:width_type=h:width=2000:g=3');
      filters.push('equalizer=f=200:width_type=h:width=200:g=-2');
    } else if (stemType === 'drums') {
      // Add drum enhancement
      filters.push('equalizer=f=100:width_type=h:width=200:g=3');
      filters.push('equalizer=f=5000:width_type=h:width=2000:g=2');
    } else if (stemType === 'bass') {
      // Add bass enhancement
      filters.push('equalizer=f=80:width_type=h:width=160:g=4');
      filters.push('equalizer=f=600:width_type=h:width=800:g=-2');
    }
  }
  
  // Apply normalization if enabled
  if (stemOptions.normalize) {
    filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
  }
  
  return {
    filterString: filters.join(','),
    outputFormat: useHighQuality ? {
      codec: 'pcm_s16le', // Uncompressed WAV
      frequency: 48000 // 48 kHz sample rate
    } : {
      codec: 'libmp3lame',
      bitrate: '320k'
    }
  };
}

module.exports = {
  buildStemFilters
};
