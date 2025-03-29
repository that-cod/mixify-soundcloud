
/**
 * Audio processing module
 * Handles basic audio file processing and conversion
 */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { createFFmpeg } = require('@ffmpeg/ffmpeg');
const { Readable } = require('stream');
const os = require('os');

// Setup FFmpeg virtual instance
const ffmpegInstance = createFFmpeg({ log: false });

// Check system resources to determine if we should use light mode
function shouldUseLightMode() {
  try {
    // Get available memory in MB
    const availableMemoryMB = Math.floor(os.freemem() / (1024 * 1024));
    const totalMemoryMB = Math.floor(os.totalmem() / (1024 * 1024));
    
    // Get CPU info
    const cpuCount = os.cpus().length;
    
    console.log(`System resources - Memory: ${availableMemoryMB}MB available of ${totalMemoryMB}MB total, CPUs: ${cpuCount}`);
    
    // Use light mode if less than 2GB of available memory or only 1-2 CPU cores
    return (availableMemoryMB < 2048) || (cpuCount <= 2);
  } catch (error) {
    console.error('Error checking system resources:', error);
    // Default to normal mode if we can't determine
    return false;
  }
}

/**
 * Processes audio file for preparation before analysis
 * @param {string} filePath Path to the audio file
 * @param {Object} options Processing options
 * @returns {Promise<Buffer>} Audio data buffer
 */
async function processAudio(filePath, options = {}) {
  try {
    // Default options
    const defaultOptions = {
      lightMode: shouldUseLightMode(),
      sampleRate: 44100,
      channels: 1,
      normalizeVolume: true,
      maxDuration: 0 // 0 means no maximum
    };
    
    // Merge options
    const opts = { ...defaultOptions, ...options };
    
    console.log(`Processing audio: ${path.basename(filePath)} (light mode: ${opts.lightMode})`);
    
    // Ensure FFmpeg is loaded
    if (!ffmpegInstance.isLoaded()) {
      await ffmpegInstance.load();
    }
    
    // Get audio file info to make informed decisions
    const fileInfo = await getAudioFileInfo(filePath);
    
    // Determine if we need to limit duration
    let durationLimit = [];
    if (opts.maxDuration > 0 && fileInfo.duration > opts.maxDuration) {
      console.log(`Audio duration (${fileInfo.duration}s) exceeds maximum (${opts.maxDuration}s), will be trimmed`);
      durationLimit = ['-t', opts.maxDuration.toString()];
    }
    
    // Reduce sample rate for very long audio in light mode
    const sampleRate = (opts.lightMode && fileInfo.duration > 180) ? 22050 : opts.sampleRate;
    
    // Convert to compatible format for analysis
    const outputPath = `${filePath.split('.')[0]}_processed.wav`;
    
    // Build ffmpeg command based on options and system capabilities
    return new Promise((resolve, reject) => {
      let command = ffmpeg(filePath)
        .audioFrequency(sampleRate)
        .audioChannels(opts.channels);
      
      // Apply volume normalization if needed
      if (opts.normalizeVolume) {
        command = command.audioFilters('loudnorm');
      }
      
      // Apply duration limit if needed
      if (durationLimit.length > 0) {
        command = command.setDuration(opts.maxDuration);
      }
      
      // For light mode, use smaller bit depth
      if (opts.lightMode) {
        command = command.audioBitrate('96k');
      }
      
      command.format('wav')
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
 * Get audio file information for making processing decisions
 * @param {string} filePath Path to the audio file
 * @returns {Promise<Object>} Audio file information
 */
function getAudioFileInfo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      
      try {
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        const fileInfo = {
          duration: parseFloat(metadata.format.duration) || 0,
          sampleRate: audioStream ? parseInt(audioStream.sample_rate) : 44100,
          channels: audioStream ? audioStream.channels : 2,
          bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : 0,
        };
        resolve(fileInfo);
      } catch (parseError) {
        console.error('Error parsing audio metadata:', parseError);
        // Return default values if we can't parse
        resolve({
          duration: 0,
          sampleRate: 44100,
          channels: 2,
          bitrate: 0
        });
      }
    });
  });
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

/**
 * Clean up temporary audio processing files
 * @param {string} basePath Base path of the files to clean up
 */
function cleanupProcessedFiles(basePath) {
  try {
    const processedPath = `${basePath.split('.')[0]}_processed.wav`;
    if (fs.existsSync(processedPath)) {
      fs.unlinkSync(processedPath);
      console.log(`Cleaned up temporary file: ${processedPath}`);
    }
  } catch (error) {
    console.warn(`Warning: Could not clean up temporary files: ${error.message}`);
  }
}

module.exports = {
  processAudio,
  createAudioStream,
  cleanupProcessedFiles,
  shouldUseLightMode,
  getAudioFileInfo
};
