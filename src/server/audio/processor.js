
/**
 * Audio processing module
 * Handles basic audio file processing and conversion
 */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { createFFmpeg } = require('@ffmpeg/ffmpeg');
const { Readable } = require('stream');

// Setup FFmpeg virtual instance
const ffmpegInstance = createFFmpeg({ log: false });

/**
 * Processes audio file for preparation before analysis
 * @param {string} filePath Path to the audio file
 * @returns {Promise<Buffer>} Audio data buffer
 */
async function processAudio(filePath) {
  try {
    // Ensure FFmpeg is loaded
    if (!ffmpegInstance.isLoaded()) {
      await ffmpegInstance.load();
    }
    
    // Convert to compatible format for analysis (16-bit PCM WAV mono)
    const outputPath = `${filePath.split('.')[0]}_processed.wav`;
    
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .audioFrequency(44100)
        .audioChannels(1)
        .format('wav')
        .on('error', (err) => reject(err))
        .on('end', () => {
          fs.readFile(outputPath, (err, data) => {
            if (err) return reject(err);
            resolve(data);
          });
        })
        .save(outputPath);
    });
  } catch (error) {
    console.error('Audio processing error:', error);
    throw new Error(`Failed to process audio: ${error.message}`);
  }
}

/**
 * Creates and returns a stream from audio buffer
 * @param {Buffer} audioBuffer Audio data buffer
 * @returns {Readable} Audio stream
 */
function createAudioStream(audioBuffer) {
  const stream = new Readable();
  stream.push(audioBuffer);
  stream.push(null);
  return stream;
}

module.exports = {
  processAudio,
  createAudioStream
};
