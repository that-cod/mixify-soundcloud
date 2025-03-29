
/**
 * Audio analysis module
 * Handles extraction of audio features using Python backend
 */

const fs = require('fs');
const Meyda = require('meyda');
const { runPythonScript } = require('../pythonBridge');
const { shouldUseLightMode } = require('./processor');

// Ensure Meyda is properly initialized
Meyda.bufferSize = 512;
Meyda.numberOfMFCCCoefficients = 13;
Meyda.windowingFunction = 'hanning';

/**
 * Analyzes audio to extract features using Python backend
 * @param {string} filePath Path to the audio file
 * @param {Object} options Analysis options
 * @returns {Promise<Object>} Extracted audio features
 */
async function analyzeAudio(filePath, options = {}) {
  try {
    // Default options
    const defaultOptions = {
      lightMode: shouldUseLightMode(),
      useFallback: false,
      cachePath: null
    };
    
    // Merge options
    const opts = { ...defaultOptions, ...options };
    
    // Check cache if enabled
    if (opts.cachePath && fs.existsSync(opts.cachePath)) {
      try {
        const cachedData = JSON.parse(fs.readFileSync(opts.cachePath, 'utf8'));
        console.log(`Using cached analysis for ${filePath}`);
        return cachedData;
      } catch (cacheError) {
        console.warn(`Cache read failed for ${filePath}:`, cacheError.message);
      }
    }
    
    // Process audio to compatible format first
    const processedFilePath = `${filePath.split('.')[0]}_processed.wav`;
    
    const fileToAnalyze = fs.existsSync(processedFilePath) ? processedFilePath : filePath;
    
    console.log(`Analyzing audio: ${path.basename(filePath)} (light mode: ${opts.lightMode})`);
    
    // Use Python backend for analysis
    try {
      // Pass the light mode flag to the Python script
      const analysisResult = await runPythonScript(
        'analyze_audio.py', 
        [fileToAnalyze, opts.lightMode.toString()]
      );
      
      // Save to cache if path provided
      if (opts.cachePath) {
        try {
          const cacheDir = path.dirname(opts.cachePath);
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          fs.writeFileSync(opts.cachePath, JSON.stringify(analysisResult));
          console.log(`Cached analysis results to ${opts.cachePath}`);
        } catch (cacheError) {
          console.warn(`Failed to cache analysis results:`, cacheError.message);
        }
      }
      
      return analysisResult;
    } catch (pythonError) {
      console.warn('Python analysis failed, using simulated analysis:', pythonError.message);
      
      if (!opts.useFallback) {
        throw new Error(`Audio analysis failed and fallback is disabled: ${pythonError.message}`);
      }
      
      return generateSimulatedAnalysis(opts.lightMode);
    }
  } catch (error) {
    console.error('Audio analysis error:', error);
    throw new Error(`Failed to analyze audio: ${error.message}`);
  }
}

// Helper functions for simulating analysis when real analysis is unavailable
function generateSimulatedAnalysis(lightMode = false) {
  return {
    bpm: Math.floor(Math.random() * (160 - 70) + 70), // 70-160 BPM
    key: ['C Major', 'A Minor', 'G Major', 'E Minor', 'D Major'][Math.floor(Math.random() * 5)],
    energy: parseFloat((Math.random() * 0.6 + 0.3).toFixed(2)),
    clarity: parseFloat((Math.random() * 0.6 + 0.3).toFixed(2)),
    waveform: generateSimulatedWaveform(lightMode),
    spectrum: generateSimulatedSpectrum(),
    light_mode: lightMode,
    simulated: true
  };
}

function generateSimulatedWaveform(lightMode = false) {
  const points = [];
  const numPoints = lightMode ? 50 : 100;
  for (let i = 0; i < numPoints; i++) {
    points.push(Math.random() * 0.5 + 0.2);
  }
  return points;
}

function generateSimulatedSpectrum() {
  const frequencies = {};
  const bands = ['low', 'mid', 'high'];
  
  bands.forEach(band => {
    frequencies[band] = Math.random() * 0.7 + 0.3;
  });
  
  return frequencies;
}

module.exports = {
  analyzeAudio
};
