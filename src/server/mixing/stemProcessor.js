
/**
 * Stem processor module
 * Handles the processing of individual stems with volume adjustments
 */

const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

/**
 * Process individual stems based on mix settings
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
  
  // Process each stem with appropriate volume levels
  const processingPromises = [];
  
  // Process track 1 stems
  processingPromises.push(
    processAudioStem(track1Stems.vocals, processedStems.track1.vocals, settings.vocalLevel1),
    processAudioStem(track1Stems.drums, processedStems.track1.drums, settings.beatLevel1),
    processAudioStem(track1Stems.bass, processedStems.track1.bass, settings.beatLevel1),
    processAudioStem(track1Stems.other, processedStems.track1.other, settings.beatLevel1)
  );
  
  // Process track 2 stems
  processingPromises.push(
    processAudioStem(track2Stems.vocals, processedStems.track2.vocals, settings.vocalLevel2),
    processAudioStem(track2Stems.drums, processedStems.track2.drums, settings.beatLevel2),
    processAudioStem(track2Stems.bass, processedStems.track2.bass, settings.beatLevel2),
    processAudioStem(track2Stems.other, processedStems.track2.other, settings.beatLevel2)
  );
  
  await Promise.all(processingPromises);
  return processedStems;
}

/**
 * Process an individual audio stem with specified volume
 * @param {string} inputPath Input stem path
 * @param {string} outputPath Output stem path
 * @param {number} volumeLevel Volume level (0-1)
 * @returns {Promise<void>}
 */
async function processAudioStem(inputPath, outputPath, volumeLevel) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`volume=${volumeLevel}`)
      .saveToFile(outputPath)
      .on('error', err => reject(err))
      .on('end', () => resolve());
  });
}

module.exports = {
  processStems,
  processAudioStem
};
