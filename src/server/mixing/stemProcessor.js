
/**
 * Stem processor module
 * Handles the processing of individual stems with advanced audio quality
 */

const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { pathResolver } = require('../utils/systemUtils');

/**
 * Process individual stems based on mix settings with enhanced quality
 * @param {Object} track1Stems Stems from track 1
 * @param {Object} track2Stems Stems from track 2
 * @param {Object} settings Mixing settings
 * @param {string} tempDir Temporary directory for processing
 * @returns {Promise<Object>} Processed stems
 */
async function processStems(track1Stems, track2Stems, settings, tempDir) {
  // Create output paths for processed stems
  const processedStems = {
    track1: {
      vocals: path.join(tempDir, 'track1_vocals_processed.wav'),
      drums: path.join(tempDir, 'track1_drums_processed.wav'),
      bass: path.join(tempDir, 'track1_bass_processed.wav'),
      other: path.join(tempDir, 'track1_other_processed.wav')
    },
    track2: {
      vocals: path.join(tempDir, 'track2_vocals_processed.wav'),
      drums: path.join(tempDir, 'track2_drums_processed.wav'),
      bass: path.join(tempDir, 'track2_bass_processed.wav'),
      other: path.join(tempDir, 'track2_other_processed.wav')
    }
  };
  
  console.log('Processing stems with enhanced quality settings...');
  
  // Use higher quality audio format for intermediate files if not in light mode
  const useHighQuality = settings.highQualityOutput !== false && settings.optimizationLevel !== 'light';
  
  // Create stem-specific processing options
  const stemProcessingOptions = {
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
  
  // Process each stem with appropriate volume levels and enhancement
  const processingPromises = [];
  
  // Enhanced processing function that adds specific processing per stem type
  async function processEnhancedStem(inputPath, outputPath, volumeLevel, stemType) {
    return new Promise((resolve, reject) => {
      try {
        // Skip if input file doesn't exist
        if (!fs.existsSync(inputPath)) {
          console.warn(`Input stem file not found: ${inputPath}`);
          reject(new Error(`Input stem file not found: ${inputPath}`));
          return;
        }
        
        // Get stem-specific options
        const stemOptions = stemProcessingOptions[stemType] || {};
        
        // Set up ffmpeg command
        const command = ffmpeg(inputPath);
        
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
        
        // Join all filters
        const filterString = filters.join(',');
        
        // Apply the filters
        command.audioFilters(filterString);
        
        // Set output format and quality
        if (useHighQuality) {
          command.audioCodec('pcm_s16le'); // Uncompressed WAV
          command.audioFrequency(48000); // 48 kHz sample rate
        } else {
          command.audioCodec('libmp3lame');
          command.audioBitrate('320k');
        }
        
        // Set up event handlers
        command
          .on('error', (err, stdout, stderr) => {
            console.error(`Error processing stem ${stemType}:`, err.message);
            console.error('FFmpeg stderr:', stderr);
            
            // Create fallback with simple volume adjustment
            console.log(`Using fallback simple processing for ${stemType}`);
            processSimpleStem(inputPath, outputPath, volumeLevel)
              .then(resolve)
              .catch(reject);
          })
          .on('end', () => {
            resolve();
          })
          .save(outputPath);
      } catch (error) {
        console.error(`Error setting up FFmpeg for ${stemType}:`, error);
        // Use fallback processing
        processSimpleStem(inputPath, outputPath, volumeLevel)
          .then(resolve)
          .catch(reject);
      }
    });
  }
  
  // Simple fallback processing with just volume adjustment
  async function processSimpleStem(inputPath, outputPath, volumeLevel) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`volume=${volumeLevel}`)
        .audioCodec('libmp3lame')
        .audioBitrate('320k')
        .on('error', err => reject(err))
        .on('end', () => resolve())
        .save(outputPath);
    });
  }
  
  // Process track 1 stems
  processingPromises.push(
    processEnhancedStem(track1Stems.vocals, processedStems.track1.vocals, settings.vocalLevel1, 'vocals'),
    processEnhancedStem(track1Stems.drums, processedStems.track1.drums, settings.beatLevel1, 'drums'),
    processEnhancedStem(track1Stems.bass, processedStems.track1.bass, settings.beatLevel1, 'bass'),
    processEnhancedStem(track1Stems.other, processedStems.track1.other, settings.beatLevel1, 'other')
  );
  
  // Process track 2 stems
  processingPromises.push(
    processEnhancedStem(track2Stems.vocals, processedStems.track2.vocals, settings.vocalLevel2, 'vocals'),
    processEnhancedStem(track2Stems.drums, processedStems.track2.drums, settings.beatLevel2, 'drums'),
    processEnhancedStem(track2Stems.bass, processedStems.track2.bass, settings.beatLevel2, 'bass'),
    processEnhancedStem(track2Stems.other, processedStems.track2.other, settings.beatLevel2, 'other')
  );
  
  try {
    await Promise.all(processingPromises);
    console.log('Stem processing completed successfully');
    return processedStems;
  } catch (error) {
    console.error('Error during stem processing:', error);
    throw new Error(`Stem processing failed: ${error.message}`);
  }
}

module.exports = {
  processStems,
};
