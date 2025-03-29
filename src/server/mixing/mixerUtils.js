
/**
 * Mixing engine utilities
 * Helper functions for the mixing process
 */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { nanoid } = require('nanoid');
const { pathResolver } = require('../utils/systemUtils');

/**
 * Create a temporary directory for the mix process
 * @param {string} baseDir Optional base directory
 * @returns {string} Path to created temp directory
 */
function createTempDirectory(baseDir) {
  // Create temporary working directory in a standardized location
  const tempBaseDir = baseDir || pathResolver.getTempDir();
  const tempDir = path.join(tempBaseDir, 'mixify-tmp', nanoid());
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Convert WAV file to MP3 format
 * @param {string} wavPath Path to WAV file
 * @param {string} mp3Path Output MP3 path
 * @returns {Promise<void>}
 */
async function convertWavToMp3(wavPath, mp3Path) {
  return new Promise((resolve, reject) => {
    ffmpeg(wavPath)
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .on('error', err => reject(err))
      .on('end', () => resolve())
      .save(mp3Path);
  });
}

/**
 * Create default mixing settings, merging with provided settings
 * @param {Object} settings User provided settings
 * @param {boolean} lightMode Whether to use light mode
 * @returns {Object} Complete settings object
 */
function createDefaultSettings(settings = {}, lightMode = false) {
  // Default settings with quality adjustments based on mode
  return {
    bpmMatch: true,
    keyMatch: true,
    vocalLevel1: 0.8,
    vocalLevel2: 0.5,
    beatLevel1: 0.6,
    beatLevel2: 0.8,
    crossfadeLength: 8,
    echo: 0.2,
    tempo: 0,
    optimizationLevel: lightMode ? 'light' : 'standard',
    advancedProcessing: !lightMode, // Enable advanced processing for standard mode
    highQualityOutput: !lightMode, // Enable high quality output for standard mode
    eqSettings: {
      // Default EQ settings for better sound quality
      bass: 0.5,
      mid: 0.5,
      treble: 0.5
    },
    enhanceClarity: true, // Enable clarity enhancement
    normalizeLoudness: true, // Enable loudness normalization
    preserveDynamics: true, // Preserve dynamic range
    intelligentGainStaging: true, // Better gain staging for cleaner mixes
    ...settings
  };
}

/**
 * Validate input files for mixing
 * @param {string} track1Path Path to first track
 * @param {string} track2Path Path to second track
 */
function validateInputFiles(track1Path, track2Path) {
  if (!fs.existsSync(track1Path)) {
    throw new Error(`Track 1 file not found: ${track1Path}`);
  }
  
  if (!fs.existsSync(track2Path)) {
    throw new Error(`Track 2 file not found: ${track2Path}`);
  }
}

/**
 * Handle file conversion if necessary when effects fail
 * @param {string} inputPath Source file path
 * @param {string} outputPath Target file path
 */
async function handleFileConversion(inputPath, outputPath) {
  // Convert WAV to MP3 if needed
  if (path.extname(outputPath).toLowerCase() === '.mp3' && path.extname(inputPath).toLowerCase() === '.wav') {
    await convertWavToMp3(inputPath, outputPath);
  } else {
    fs.copyFileSync(inputPath, outputPath);
  }
}

module.exports = {
  createTempDirectory,
  convertWavToMp3,
  createDefaultSettings,
  validateInputFiles,
  handleFileConversion
};
