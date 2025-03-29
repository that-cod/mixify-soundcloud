/**
 * Enhanced effects processor module
 * Handles application of high-quality final effects to mixed audio
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { pathResolver } = require('../utils/systemUtils');

/**
 * Apply final effects to the mixed audio with enhanced quality
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
    
    console.log(`Applying enhanced effects to ${path.basename(inputPath)}`);
    
    // Get EQ settings or defaults
    const eqSettings = settings.eqSettings || { bass: 0.5, mid: 0.5, treble: 0.5 };
    
    // Convert 0-1 scale EQ settings to dB adjustments (-6 to +6 dB range)
    const bassGain = ((eqSettings.bass || 0.5) * 12) - 6;
    const midGain = ((eqSettings.mid || 0.5) * 12) - 6;
    const trebleGain = ((eqSettings.treble || 0.5) * 12) - 6;
    
    // Create advanced filter chain based on settings
    const filters = [];
    
    // Add reverb/echo effect if requested
    if (settings.echo > 0) {
      // Use advanced echo/reverb with multiple reflections for more natural sound
      const scaledDelay = Math.round(settings.echo * 0.5 * 1000); // 0-500ms
      const scaledDecay = Math.min(0.8, settings.echo * 0.9); // 0-0.8
      
      if (settings.optimizationLevel !== 'light' && settings.echo > 0.3) {
        // Advanced reverb for higher quality (more computationally intensive)
        filters.push(`aecho=0.6:${scaledDelay}:${scaledDelay * 1.5}:${scaledDecay},aecho=0.3:${scaledDelay * 2}:${scaledDelay * 3}:${scaledDecay * 0.5}`);
      } else {
        // Simple echo for light mode
        filters.push(`aecho=0.6:${scaledDelay}:${scaledDelay * 2}:${scaledDecay}`);
      }
    }
    
    // Apply 3-band equalization using precise frequency ranges
    if (settings.optimizationLevel !== 'light') {
      // Advanced 3-band EQ (bass, mid, treble)
      filters.push(`equalizer=f=80:width_type=h:width=160:g=${bassGain}`); // Bass (around 80Hz)
      filters.push(`equalizer=f=1000:width_type=h:width=800:g=${midGain}`); // Mid (around 1kHz)
      filters.push(`equalizer=f=8000:width_type=h:width=8000:g=${trebleGain}`); // Treble (around 8kHz)
    } else {
      // Simplified EQ for light mode
      filters.push(`equalizer=f=100:width_type=h:width=200:g=${bassGain}`); // Bass
      filters.push(`equalizer=f=5000:width_type=h:width=5000:g=${trebleGain}`); // Treble
    }
    
    // Apply advanced compression for consistent levels
    if (settings.optimizationLevel !== 'light') {
      filters.push('acompressor=threshold=-12dB:ratio=3:attack=200:release=1000:makeup=2');
    } else {
      // Simpler compression for light mode
      filters.push('acompressor=threshold=-20dB:ratio=4:attack=200:release=1000');
    }
    
    // Apply loudness normalization if enabled (using EBU R128 standard)
    if (settings.normalizeLoudness !== false) {
      // Use dynamic normalization based on content
      filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
    }
    
    // Apply clarity enhancement if requested (surgical EQ to reduce muddiness)
    if (settings.enhanceClarity === true && settings.optimizationLevel !== 'light') {
      // Reduce mud around 300Hz
      filters.push('equalizer=f=300:width_type=h:width=100:g=-2');
      // Boost presence around 3kHz
      filters.push('equalizer=f=3000:width_type=h:width=2000:g=2');
    }
    
    // Apply stereo enhancement if not in light mode
    if (settings.optimizationLevel !== 'light') {
      filters.push('stereotools=mlev=0.2');
    }
    
    // Add final limiter to prevent clipping
    filters.push('alimiter=limit=1:attack=5:release=50');
    
    // Join all filters
    const filterString = filters.join(',');
    
    // Determine output format and quality settings
    const outputFormat = settings.format || path.extname(outputPath).replace('.', '') || 'mp3';
    const outputBitrate = settings.bitrate || (outputFormat === 'wav' ? '1411k' : '320k');
    const outputSampleRate = settings.sampleRate || (settings.highQualityOutput ? 48000 : 44100);
    
    // Apply filters using ffmpeg with better error handling
    try {
      const command = ffmpeg(inputPath);
      
      // Set audio filters
      command.audioFilters(filterString);
      
      // Set output format based on settings
      if (outputFormat === 'wav') {
        command.format('wav');
        command.audioCodec('pcm_s16le');
      } else if (outputFormat === 'mp3') {
        command.format('mp3');
        command.audioCodec('libmp3lame');
        command.audioBitrate(outputBitrate);
      } else if (outputFormat === 'aac' || outputFormat === 'm4a') {
        command.format(outputFormat);
        command.audioCodec('aac');
        command.audioBitrate(outputBitrate);
      } else {
        // Default to mp3
        command.format('mp3');
        command.audioCodec('libmp3lame');
        command.audioBitrate('320k');
      }
      
      // Set sample rate
      command.audioFrequency(outputSampleRate);
      
      // Set audio channels (stereo)
      command.audioChannels(2);
      
      // Set event handlers with better error handling
      command
        .on('start', cmdline => {
          console.log('FFmpeg effects command:', cmdline);
        })
        .on('progress', progress => {
          // Log progress every 20%
          if (progress.percent && progress.percent % 20 < 1) {
            console.log(`Effects processing: ${Math.round(progress.percent)}% complete`);
          }
        })
        .on('error', (err, stdout, stderr) => {
          console.error('FFmpeg effects error:', err.message);
          console.error('FFmpeg stderr:', stderr);
          
          // Try fallback with simpler effects
          if (filters.length > 1) {
            console.log('Attempting fallback with simpler effects');
            applyFallbackEffects(inputPath, outputPath, settings)
              .then(resolve)
              .catch(fallbackErr => {
                console.error('Fallback effects failed:', fallbackErr);
                // If even simple effects fail, just copy the file
                copyInputToOutput(inputPath, outputPath)
                  .then(resolve)
                  .catch(reject);
              });
          } else {
            // If even simple effects fail, just copy the file
            copyInputToOutput(inputPath, outputPath)
              .then(resolve)
              .catch(reject);
          }
        })
        .on('end', () => {
          console.log(`Enhanced effects applied successfully to ${path.basename(outputPath)}`);
          resolve();
        })
        .save(outputPath);
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
 * @param {Object} settings Settings object
 * @returns {Promise<void>}
 */
async function applyFallbackEffects(inputPath, outputPath, settings) {
  return new Promise((resolve, reject) => {
    // Just apply normalization and simple limiter
    ffmpeg(inputPath)
      .audioFilters('loudnorm=I=-16:TP=-1.5,alimiter')
      .audioCodec(path.extname(outputPath).toLowerCase() === '.wav' ? 'pcm_s16le' : 'libmp3lame')
      .audioBitrate(path.extname(outputPath).toLowerCase() === '.wav' ? '1411k' : '320k')
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
      .save(outputPath);
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
    // If input and output extensions match, do a direct copy
    if (path.extname(inputPath).toLowerCase() === path.extname(outputPath).toLowerCase()) {
      try {
        fs.copyFileSync(inputPath, outputPath);
        console.log(`Copied ${path.basename(inputPath)} to ${path.basename(outputPath)} (no effects applied)`);
        resolve();
      } catch (copyError) {
        console.error('File copy error:', copyError);
        reject(copyError);
      }
    } else {
      // Otherwise, use ffmpeg to convert the format
      ffmpeg(inputPath)
        .audioCodec(path.extname(outputPath).toLowerCase() === '.wav' ? 'pcm_s16le' : 'libmp3lame')
        .on('error', err => reject(err))
        .on('end', () => {
          console.log(`Converted ${path.basename(inputPath)} to ${path.basename(outputPath)} (no effects applied)`);
          resolve();
        })
        .save(outputPath);
    }
  });
}

module.exports = {
  applyFinalEffects
};
