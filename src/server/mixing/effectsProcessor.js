
/**
 * Effects processor module
 * Handles application of final effects to mixed audio
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

/**
 * Apply final effects to the mixed audio
 * @param {string} inputPath Input audio file
 * @param {string} outputPath Output audio file
 * @param {Object} settings Effect settings
 * @returns {Promise<void>}
 */
async function applyFinalEffects(inputPath, outputPath, settings) {
  return new Promise((resolve, reject) => {
    // Validate input file exists
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file not found: ${inputPath}`));
    }
    
    console.log(`Applying effects to ${path.basename(inputPath)}`);
    
    // Create filter chain based on settings
    const filters = [];
    
    // Add reverb/echo effect if requested
    if (settings.echo > 0) {
      // Scale echo from 0-1 to more reasonable values
      const scaledDelay = Math.round(settings.echo * 0.5 * 1000); // 0-500ms
      const scaledDecay = Math.min(0.8, settings.echo * 0.9); // 0-0.8
      
      filters.push(`aecho=0.6:${scaledDelay}:${scaledDelay * 2}:${scaledDecay}`);
    }
    
    // Apply normalization
    filters.push('loudnorm=I=-16:LRA=11:TP=-1.5');
    
    // Apply light compression
    filters.push('acompressor=threshold=0.05:ratio=4:attack=200:release=1000');
    
    // Join all filters
    const filterString = filters.join(',');
    
    // Apply filters using ffmpeg
    try {
      const command = ffmpeg(inputPath)
        .audioFilters(filterString)
        .audioCodec('libmp3lame')
        .audioBitrate('320k')
        .on('error', err => {
          console.error('FFmpeg effects error:', err);
          
          // Try fallback with simpler effects
          if (filters.length > 1) {
            console.log('Attempting fallback with simpler effects');
            applyFallbackEffects(inputPath, outputPath)
              .then(resolve)
              .catch(reject);
          } else {
            // If even simple effects fail, just copy the file
            copyInputToOutput(inputPath, outputPath)
              .then(resolve)
              .catch(reject);
          }
        })
        .on('end', () => {
          console.log(`Effects applied successfully to ${path.basename(outputPath)}`);
          resolve();
        })
        .saveToFile(outputPath);
    } catch (ffmpegError) {
      console.error('FFmpeg initialization error:', ffmpegError);
      
      // Fallback to simple copy
      copyInputToOutput(inputPath, outputPath)
        .then(resolve)
        .catch(reject);
    }
  });
}

/**
 * Apply minimal fallback effects when full effects fail
 * @param {string} inputPath Input audio path
 * @param {string} outputPath Output audio path
 * @returns {Promise<void>}
 */
async function applyFallbackEffects(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Just apply normalization
    ffmpeg(inputPath)
      .audioFilters('loudnorm=I=-16:TP=-1.5')
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .on('error', err => {
        console.error('Fallback effects error:', err);
        // If even this fails, just copy the file
        copyInputToOutput(inputPath, outputPath)
          .then(resolve)
          .catch(reject);
      })
      .on('end', () => {
        console.log(`Applied fallback effects to ${path.basename(outputPath)}`);
        resolve();
      })
      .saveToFile(outputPath);
  });
}

/**
 * Last resort - just copy the input to output
 * @param {string} inputPath Input file path
 * @param {string} outputPath Output file path
 * @returns {Promise<void>}
 */
async function copyInputToOutput(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      fs.copyFileSync(inputPath, outputPath);
      console.log(`Copied ${path.basename(inputPath)} to ${path.basename(outputPath)} (no effects applied)`);
      resolve();
    } catch (copyError) {
      console.error('File copy error:', copyError);
      reject(copyError);
    }
  });
}

module.exports = {
  applyFinalEffects
};
