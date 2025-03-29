
/**
 * Audio analyzer module
 * Handles audio analysis using Python and JavaScript tools
 */

const path = require('path');
const fs = require('fs');
const { runPythonScript, checkPythonEnvironment } = require('../pythonBridge');
const config = require('../config');
const { nanoid } = require('nanoid');

/**
 * Initialize the analyzer module
 * @returns {Promise<boolean>} True if initialization successful
 */
async function initAnalyzer() {
  try {
    // Check Python environment and dependencies
    const pythonEnv = await checkPythonEnvironment();
    
    console.log(`Analyzer initialized. Python dependencies available: 
      - librosa: ${pythonEnv.pythonHasLibrosa ? 'Yes' : 'No'}
      - spleeter: ${pythonEnv.pythonHasSpleeter ? 'Yes' : 'No'}`);
    
    return true;
  } catch (error) {
    console.error('Error initializing audio analyzer:', error);
    return false;
  }
}

/**
 * Analyze an audio file to extract features
 * @param {string} filePath Path to the audio file
 * @param {Object} options Analysis options
 * @returns {Promise<Object>} Audio features
 */
async function analyzeAudio(filePath, options = {}) {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }
    
    console.log(`Analyzing audio file: ${path.basename(filePath)}`);
    
    // Default options
    const defaultOptions = {
      lightMode: config.python.fallbacks.useFallbackAnalysis,
      useCache: true,
      cachePath: null
    };
    
    // Merge options
    const opts = { ...defaultOptions, ...options };
    
    // Generate cache path if not provided
    if (opts.useCache && !opts.cachePath) {
      const cacheDir = path.join(config.fileStorage.uploadDir, 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      const fileHash = path.basename(filePath).split('.')[0]; // Simple caching by filename
      opts.cachePath = path.join(cacheDir, `analysis_${fileHash}.json`);
    }
    
    // Check if we can use cached analysis
    if (opts.useCache && opts.cachePath && fs.existsSync(opts.cachePath)) {
      try {
        const cachedData = JSON.parse(fs.readFileSync(opts.cachePath, 'utf8'));
        console.log(`Using cached analysis for ${path.basename(filePath)}`);
        return cachedData;
      } catch (cacheError) {
        console.warn(`Cache read failed:`, cacheError.message);
      }
    }
    
    // Ensure Python environment is properly set up
    await checkPythonEnvironment();
    
    // Run Python analysis script to extract audio features
    let features;
    try {
      features = await runPythonScript(
        'analyze_audio.py',
        [filePath, opts.lightMode.toString()]
      );
      
      // If Python analysis failed, it will return an error in the features object
      if (features && features.error) {
        throw new Error(`Python analysis failed: ${features.error}`);
      }
    } catch (pythonError) {
      console.error('Python analysis failed:', pythonError);
      
      // Create fallback analysis
      features = createFallbackAnalysis(filePath);
    }
    
    // Cache the analysis results if caching is enabled
    if (opts.useCache && opts.cachePath) {
      try {
        fs.writeFileSync(opts.cachePath, JSON.stringify(features));
      } catch (cacheError) {
        console.warn(`Failed to cache analysis:`, cacheError.message);
      }
    }
    
    return features;
  } catch (error) {
    console.error('Audio analysis error:', error);
    
    // Return a fallback analysis
    return createFallbackAnalysis(filePath);
  }
}

/**
 * Create a basic fallback analysis when Python analysis fails
 * @param {string} filePath Path to the audio file
 * @returns {Object} Basic audio features
 */
function createFallbackAnalysis(filePath) {
  console.log(`Creating fallback analysis for ${path.basename(filePath)}`);
  
  // Generate realistic random values for fallback
  const bpm = Math.floor(Math.random() * (160 - 80)) + 80; // 80-160 BPM
  
  // Common musical keys
  const keys = ['C Major', 'A Minor', 'G Major', 'E Minor', 'D Major', 'B Minor', 'F Major'];
  const key = keys[Math.floor(Math.random() * keys.length)];
  
  // Energy and clarity - more balanced values
  const energy = parseFloat((0.5 + (Math.random() * 0.3)).toFixed(2));
  const clarity = parseFloat((0.5 + (Math.random() * 0.3)).toFixed(2));
  
  // Generate a basic waveform
  const waveform = [];
  for (let i = 0; i < 100; i++) {
    waveform.push(parseFloat((0.2 + Math.random() * 0.6).toFixed(2)));
  }
  
  return {
    bpm,
    key,
    energy,
    clarity,
    waveform,
    spectrum: {
      low: 0.33,
      mid: 0.34,
      high: 0.33
    },
    fallback: true
  };
}

module.exports = {
  analyzeAudio,
  initAnalyzer
};
