
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

/**
 * Initialize the stem separator module
 * @returns {Promise<boolean>} True if initialization successful
 */
async function initStemSeparator() {
  try {
    // Check Python environment and dependencies
    const pythonEnv = await checkPythonEnvironment();
    
    console.log(`Stem separator initialized. Spleeter available: ${pythonEnv.pythonHasSpleeter ? 'Yes' : 'No'}`);
    
    return pythonEnv.pythonHasSpleeter;
  } catch (error) {
    console.error('Error initializing stem separator:', error);
    return false;
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
      useCache: true
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
    
    // Call the Python script with progress updates if available
    let stemPaths;
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
      
      // Verify the stem paths
      const stemPathsValid = validateStemPaths(stemPaths);
      if (!stemPathsValid) {
        throw new Error("Invalid stem paths returned from Python");
      }
      
    } catch (pythonError) {
      console.error('Python stem separation failed:', pythonError);
      
      // Create fallback stems
      stemPaths = await createFallbackStems(filePath, opts.outputDir);
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

module.exports = {
  separateTracks,
  initStemSeparator
};
