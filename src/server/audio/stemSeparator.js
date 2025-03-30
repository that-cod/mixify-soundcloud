/**
 * Stem separator module
 * Core functionality for separating audio tracks into stems
 */

const { checkPythonEnvironment } = require('../pythonBridge');
const { shouldUseLightMode } = require('./processor');
const { runPythonScriptWithProgress, runPythonScript } = require('../pythonBridge');
const { validateStemPaths, saveStemCache, readStemCache } = require('./stemSeparatorUtils');
const { createFallbackStems } = require('./fallbackStemGenerator');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { nanoid } = require('nanoid');
const ffmpeg = require('fluent-ffmpeg');

// Flag to track whether we prefer lightweight mode
let preferLightweightMode = false;

/**
 * Initialize the stem separator module
 * @returns {Promise<boolean>} True if initialization successful
 */
async function initStemSeparator() {
  try {
    // Check Python environment and dependencies
    const pythonEnv = await checkPythonEnvironment();
    
    console.log(`Stem separator initialized. Spleeter available: ${pythonEnv.pythonHasSpleeter ? 'Yes' : 'No'}`);
    
    // If spleeter is not available, use lightweight mode
    preferLightweightMode = !pythonEnv.pythonHasSpleeter;
    
    return true;
  } catch (error) {
    console.error('Error initializing stem separator:', error);
    preferLightweightMode = true;
    return true; // Still return true as we have fallbacks
  }
}

/**
 * Separates an audio file into stems (vocals, drums, bass, other)
 * @param {string} filePath Path to the audio file
 * @param {Object} options Separation options
 * @returns {Promise<Object>} Paths to separated stems
 */
async function separateTracks(filePath, options = {}) {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }
    
    // Ensure Python environment is properly set up
    await checkPythonEnvironment();
    
    // Default options
    const defaultOptions = {
      outputDir: path.join(config.fileStorage.uploadDir, 'stems', nanoid()),
      lightMode: shouldUseLightMode(),
      onProgress: null,
      cachePath: null,
      useCache: true,
      forceSimplified: preferLightweightMode
    };
    
    // Merge options
    const opts = { ...defaultOptions, ...options };
    
    // Ensure output directory exists
    if (!fs.existsSync(opts.outputDir)) {
      fs.mkdirSync(opts.outputDir, { recursive: true });
    }
    
    // Generate cache path if not provided but caching is enabled
    if (opts.useCache && !opts.cachePath) {
      const cacheDir = path.join(config.fileStorage.uploadDir, 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      const fileHash = path.basename(filePath).split('.')[0]; // Simple caching by filename
      opts.cachePath = path.join(cacheDir, `stems_${fileHash}.json`);
    }
    
    // Check if we already have stems cached
    if (opts.useCache && opts.cachePath) {
      const cachedStems = readStemCache(opts.cachePath);
      if (cachedStems) {
        return cachedStems;
      }
    }
    
    console.log(`Separating stems for ${path.basename(filePath)} (light mode: ${opts.lightMode})`);
    
    // Choose between simplified or full separation
    let stemPaths;
    
    if (opts.forceSimplified || opts.lightMode) {
      // Use the lightweight stem separator
      console.log('Using simplified FFmpeg-based stem separation');
      stemPaths = await runPythonScriptWithProgress(
        'simplified_stem_separator.py', 
        [filePath, opts.outputDir, opts.lightMode.toString()],
        opts.onProgress
      );
    } else {
      // Use full ML-based stem separation
      try {
        if (opts.onProgress) {
          stemPaths = await runPythonScriptWithProgress(
            'separate_stems.py', 
            [filePath, opts.outputDir, opts.lightMode.toString()],
            opts.onProgress
          );
        } else {
          stemPaths = await runPythonScript(
            'separate_stems.py', 
            [filePath, opts.outputDir, opts.lightMode.toString()]
          );
        }
      } catch (pythonError) {
        console.error('Python stem separation failed, falling back to simplified method:', pythonError);
        
        // Fall back to simplified method
        stemPaths = await runPythonScriptWithProgress(
          'simplified_stem_separator.py', 
          [filePath, opts.outputDir, 'true'],
          opts.onProgress
        );
      }
    }
    
    // Verify the stem paths
    const stemPathsValid = validateStemPaths(stemPaths);
    if (!stemPathsValid) {
      throw new Error("Invalid stem paths returned from Python");
    }
    
    // Save to cache if path provided
    if (opts.useCache && opts.cachePath) {
      saveStemCache(opts.cachePath, stemPaths);
    }
    
    return stemPaths;
  } catch (error) {
    console.error('Stem separation error:', error);
    
    // Create fallback stems if anything fails
    return createFallbackStems(filePath, options.outputDir || path.join(config.fileStorage.uploadDir, 'stems', nanoid()));
  }
}

/**
 * Create simplified stems directly using FFmpeg when Python is not available
 * @param {string} filePath Path to the audio file
 * @param {string} outputDir Output directory for stems
 * @returns {Promise<Object>} Paths to separated stems
 */
async function createSimplifiedStemsWithFFmpeg(filePath, outputDir) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Creating simplified stems with FFmpeg for ${path.basename(filePath)}`);
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Base filename without extension
      const baseFilename = path.basename(filePath).split('.')[0];
      const stemDir = path.join(outputDir, baseFilename);
      
      // Create stem directory if it doesn't exist
      if (!fs.existsSync(stemDir)) {
        fs.mkdirSync(stemDir, { recursive: true });
      }
      
      // Define stem file paths
      const stems = {
        vocals: path.join(stemDir, 'vocals.mp3'),
        drums: path.join(stemDir, 'drums.mp3'),
        bass: path.join(stemDir, 'bass.mp3'),
        other: path.join(stemDir, 'other.mp3')
      };
      
      // Process each stem
      const stemPromises = [
        // Vocals - focus on mid frequencies
        new Promise((resolveVocal) => {
          ffmpeg(filePath)
            .outputOptions(['-af', 'bandpass=f=2000:width_type=h:width=4800,acompressor=threshold=-20dB:ratio=4:attack=20:release=100'])
            .audioCodec('libmp3lame')
            .audioBitrate('192k')
            .on('error', (err) => {
              console.error('Error creating vocal stem:', err);
              // Create empty file as fallback
              fs.writeFileSync(stems.vocals, '');
              resolveVocal();
            })
            .on('end', resolveVocal)
            .save(stems.vocals);
        }),
        
        // Drums - focus on transients
        new Promise((resolveDrums) => {
          ffmpeg(filePath)
            .outputOptions(['-af', 'highpass=f=200,lowpass=f=8000,acompressor=threshold=-15dB:ratio=5:attack=5:release=50'])
            .audioCodec('libmp3lame')
            .audioBitrate('192k')
            .on('error', (err) => {
              console.error('Error creating drums stem:', err);
              // Create empty file as fallback
              fs.writeFileSync(stems.drums, '');
              resolveDrums();
            })
            .on('end', resolveDrums)
            .save(stems.drums);
        }),
        
        // Bass - focus on low frequencies
        new Promise((resolveBass) => {
          ffmpeg(filePath)
            .outputOptions(['-af', 'lowpass=f=250,acompressor=threshold=-10dB:ratio=6:attack=10:release=80'])
            .audioCodec('libmp3lame')
            .audioBitrate('192k')
            .on('error', (err) => {
              console.error('Error creating bass stem:', err);
              // Create empty file as fallback
              fs.writeFileSync(stems.bass, '');
              resolveBass();
            })
            .on('end', resolveBass)
            .save(stems.bass);
        }),
        
        // Other - everything else
        new Promise((resolveOther) => {
          ffmpeg(filePath)
            .outputOptions(['-af', 'bandreject=f=2000:width_type=h:width=4800,bandreject=f=100:width_type=h:width=300'])
            .audioCodec('libmp3lame')
            .audioBitrate('192k')
            .on('error', (err) => {
              console.error('Error creating other stem:', err);
              // Create empty file as fallback
              fs.writeFileSync(stems.other, '');
              resolveOther();
            })
            .on('end', resolveOther)
            .save(stems.other);
        })
      ];
      
      // Wait for all stems to be created
      await Promise.all(stemPromises);
      
      resolve(stems);
    } catch (error) {
      console.error('Error in simplified stem creation:', error);
      reject(error);
    }
  });
}

module.exports = {
  separateTracks,
  initStemSeparator,
  createSimplifiedStemsWithFFmpeg
};
