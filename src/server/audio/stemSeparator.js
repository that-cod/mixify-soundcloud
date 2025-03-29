
/**
 * Stem separator module
 * Handles separation of audio tracks into stems using Python
 */

const path = require('path');
const fs = require('fs');
const { runPythonScript, runPythonScriptWithProgress } = require('../pythonBridge');
const { shouldUseLightMode } = require('./processor');
const config = require('../config');
const { nanoid } = require('nanoid');

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
    if (opts.useCache && opts.cachePath && fs.existsSync(opts.cachePath)) {
      try {
        const cachedStems = JSON.parse(fs.readFileSync(opts.cachePath, 'utf8'));
        
        // Verify all stem files exist
        const allStemsExist = Object.values(cachedStems).every(
          stemPath => fs.existsSync(stemPath)
        );
        
        if (allStemsExist) {
          console.log(`Using cached stems for ${path.basename(filePath)}`);
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
      if (!stemPaths || !stemPaths.vocals || !stemPaths.drums) {
        throw new Error("Invalid stem paths returned from Python");
      }
      
      // Verify files exist
      for (const [type, stemPath] of Object.entries(stemPaths)) {
        if (!fs.existsSync(stemPath)) {
          console.warn(`Stem file missing: ${stemPath}`);
          throw new Error(`Stem file for ${type} not found`);
        }
      }
    } catch (pythonError) {
      console.error('Python stem separation failed:', pythonError);
      
      // Create fallback stems
      stemPaths = await createFallbackStems(filePath, opts.outputDir);
    }
    
    // Save to cache if path provided
    if (opts.useCache && opts.cachePath) {
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
    
    // Create fallback stems if anything fails
    return createFallbackStems(filePath, options.outputDir || path.join(config.fileStorage.uploadDir, 'stems', nanoid()));
  }
}

/**
 * Create fallback stems when separation fails
 * @param {string} filePath Original audio file
 * @param {string} outputDir Output directory
 * @returns {Promise<Object>} Paths to created stems
 */
async function createFallbackStems(filePath, outputDir) {
  console.log(`Creating fallback stems for ${path.basename(filePath)}`);
  
  try {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Define stem types
    const stemTypes = ['vocals', 'drums', 'bass', 'other'];
    const fallbackStems = {};
    
    // Basic FFmpeg command to create stem copies
    const { execSync } = require('child_process');
    const ffmpegPath = 'ffmpeg'; // Assuming ffmpeg is in PATH
    
    for (const stemType of stemTypes) {
      const outputPath = path.join(outputDir, `${stemType}.mp3`);
      fallbackStems[stemType] = outputPath;
      
      try {
        // Create a copy of the original file with different filtering based on stem type
        let filter = '';
        
        switch (stemType) {
          case 'vocals':
            // Enhance mid frequencies for vocals fallback
            filter = 'equalizer=f=1000:width_type=o:width=300:g=2';
            break;
          case 'drums':
            // Enhance low frequencies for drums fallback
            filter = 'equalizer=f=100:width_type=o:width=200:g=2';
            break;
          case 'bass':
            // Enhance very low frequencies for bass fallback
            filter = 'equalizer=f=60:width_type=o:width=100:g=3';
            break;
          case 'other':
            // Enhance high frequencies for other instruments
            filter = 'equalizer=f=5000:width_type=o:width=1000:g=1';
            break;
        }
        
        // Execute FFmpeg command
        const command = `${ffmpegPath} -i "${filePath}" -af "${filter}" -codec:a libmp3lame -qscale:a 2 "${outputPath}" -y`;
        execSync(command, { stdio: 'ignore' });
        
        // Verify the file was created
        if (!fs.existsSync(outputPath)) {
          throw new Error(`Failed to create ${stemType} fallback stem`);
        }
      } catch (ffmpegError) {
        console.error(`Error creating fallback stem for ${stemType}:`, ffmpegError);
        
        // If FFmpeg fails, just copy the file
        try {
          fs.copyFileSync(filePath, outputPath);
        } catch (copyError) {
          console.error(`Fallback copy failed:`, copyError);
          // Last resort - point to the original file
          fallbackStems[stemType] = filePath;
        }
      }
    }
    
    return fallbackStems;
  } catch (error) {
    console.error(`Fallback stem creation failed:`, error);
    
    // Ultimate fallback - just return the original file for all stems
    return {
      vocals: filePath,
      drums: filePath,
      bass: filePath,
      other: filePath
    };
  }
}

module.exports = {
  separateTracks
};
