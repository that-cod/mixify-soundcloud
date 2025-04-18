
/**
 * Stem processor module
 * Handles the processing of individual stems with advanced audio quality
 */

const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { createStemProcessingOptions } = require('./stemEnhancementOptions');
const { buildStemFilters } = require('./stemFilterBuilder');

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
  const stemProcessingOptions = createStemProcessingOptions(settings);
  
  // Process each stem with appropriate volume levels and enhancement
  const processingPromises = [];
  
  // Process tracks
  processingPromises.push(
    // Process track 1 stems
    processEnhancedStem(track1Stems.vocals, processedStems.track1.vocals, settings.vocalLevel1, 'vocals', stemProcessingOptions, useHighQuality),
    processEnhancedStem(track1Stems.drums, processedStems.track1.drums, settings.beatLevel1, 'drums', stemProcessingOptions, useHighQuality),
    processEnhancedStem(track1Stems.bass, processedStems.track1.bass, settings.beatLevel1, 'bass', stemProcessingOptions, useHighQuality),
    processEnhancedStem(track1Stems.other, processedStems.track1.other, settings.beatLevel1, 'other', stemProcessingOptions, useHighQuality),
    
    // Process track 2 stems
    processEnhancedStem(track2Stems.vocals, processedStems.track2.vocals, settings.vocalLevel2, 'vocals', stemProcessingOptions, useHighQuality),
    processEnhancedStem(track2Stems.drums, processedStems.track2.drums, settings.beatLevel2, 'drums', stemProcessingOptions, useHighQuality),
    processEnhancedStem(track2Stems.bass, processedStems.track2.bass, settings.beatLevel2, 'bass', stemProcessingOptions, useHighQuality),
    processEnhancedStem(track2Stems.other, processedStems.track2.other, settings.beatLevel2, 'other', stemProcessingOptions, useHighQuality)
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

/**
 * Enhanced processing function that adds specific processing per stem type
 * @param {string} inputPath Path to input stem file
 * @param {string} outputPath Path for processed output file
 * @param {number} volumeLevel Volume level to apply
 * @param {string} stemType Type of stem (vocals, drums, bass, other)
 * @param {Object} stemProcessingOptions Options for each stem type
 * @param {boolean} useHighQuality Whether to use high quality processing
 * @returns {Promise<void>}
 */
async function processEnhancedStem(inputPath, outputPath, volumeLevel, stemType, stemProcessingOptions, useHighQuality) {
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
      
      // Build audio filters
      const { filterString, outputFormat } = buildStemFilters(stemType, stemOptions, volumeLevel, useHighQuality);
      
      // Set up ffmpeg command
      const command = ffmpeg(inputPath);
      
      // Apply the filters
      command.audioFilters(filterString);
      
      // Set output format and quality
      command.audioCodec(outputFormat.codec);
      if (outputFormat.frequency) {
        command.audioFrequency(outputFormat.frequency);
      }
      if (outputFormat.bitrate) {
        command.audioBitrate(outputFormat.bitrate);
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

/**
 * Simple fallback processing with just volume adjustment
 * @param {string} inputPath Path to input stem file
 * @param {string} outputPath Path for processed output file
 * @param {number} volumeLevel Volume level to apply
 * @returns {Promise<void>}
 */
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

module.exports = {
  processStems,
};
