
/**
 * Stem separator module
 * Handles separation of audio tracks into stems using Python
 */

const path = require('path');
const fs = require('fs');
const { runPythonScript, runPythonScriptWithProgress } = require('../pythonBridge');
const { shouldUseLightMode } = require('./processor');

/**
 * Separates an audio file into stems (vocals, drums, bass, other)
 * @param {string} filePath Path to the audio file
 * @param {Object} options Separation options
 * @returns {Promise<Object>} Paths to separated stems
 */
async function separateTracks(filePath, options = {}) {
  try {
    // Default options
    const defaultOptions = {
      outputDir: path.join(path.dirname(filePath), 'stems'),
      lightMode: shouldUseLightMode(),
      onProgress: null,
      cachePath: null
    };
    
    // Merge options
    const opts = { ...defaultOptions, ...options };
    
    // Ensure output directory exists
    if (!fs.existsSync(opts.outputDir)) {
      fs.mkdirSync(opts.outputDir, { recursive: true });
    }
    
    // Check if we already have stems cached
    if (opts.cachePath && fs.existsSync(opts.cachePath)) {
      try {
        const cachedStems = JSON.parse(fs.readFileSync(opts.cachePath, 'utf8'));
        
        // Verify all stem files exist
        const allStemsExist = Object.values(cachedStems).every(
          stemPath => fs.existsSync(stemPath)
        );
        
        if (allStemsExist) {
          console.log(`Using cached stems for ${filePath}`);
          return cachedStems;
        } else {
          console.warn(`Some cached stems are missing, will regenerate`);
        }
      } catch (cacheError) {
        console.warn(`Cache read failed for stems:`, cacheError.message);
      }
    }
    
    console.log(`Separating stems for ${path.basename(filePath)} (light mode: ${opts.lightMode})`);
    
    // Call the Python script with progress updates if available
    let stemPaths;
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
    
    // Save to cache if path provided
    if (opts.cachePath) {
      try {
        const cacheDir = path.dirname(opts.cachePath);
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        fs.writeFileSync(opts.cachePath, JSON.stringify(stemPaths));
        console.log(`Cached stem paths to ${opts.cachePath}`);
      } catch (cacheError) {
        console.warn(`Failed to cache stem paths:`, cacheError.message);
      }
    }
    
    return stemPaths;
  } catch (error) {
    console.error('Stem separation error:', error);
    throw new Error(`Failed to separate stems: ${error.message}`);
  }
}

module.exports = {
  separateTracks
};
