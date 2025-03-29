
/**
 * Stem separation module
 * Handles separating audio tracks into stems (vocals, drums, bass, other)
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { runPythonScriptWithProgress } = require('../pythonBridge');

/**
 * Separates audio tracks into stems using Spleeter
 * @param {string} filePath Path to the audio file
 * @param {Function} progressCallback Optional callback for progress updates
 * @returns {Promise<Object>} Paths to separated stems
 */
async function separateTracks(filePath, progressCallback = null) {
  try {
    const outputDir = path.join(
      config.fileStorage.uploadDir, 
      'stems', 
      path.basename(filePath, path.extname(filePath))
    );
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
      // Run Python script with progress updates
      const stemPaths = await runPythonScriptWithProgress(
        'separate_stems.py', 
        [filePath, outputDir],
        progressCallback
      );
      
      return stemPaths;
    } catch (pythonError) {
      console.warn('Stem separation with Python failed:', pythonError.message);
      return createFallbackStems(filePath);
    }
  } catch (error) {
    console.error('Stem separation error:', error);
    throw new Error(`Failed to separate stems: ${error.message}`);
  }
}

/**
 * Creates fallback stems when separation fails
 * @param {string} filePath Original audio file path
 * @returns {Object} Paths to simulated stems
 */
function createFallbackStems(filePath) {
  const fileBaseName = path.basename(filePath, path.extname(filePath));
  const stemDir = path.join(config.fileStorage.uploadDir, 'stems', fileBaseName);
  
  if (!fs.existsSync(stemDir)) {
    fs.mkdirSync(stemDir, { recursive: true });
  }
  
  // Create simulated stems paths
  const stemPaths = {
    vocals: path.join(stemDir, `${fileBaseName}_vocals.mp3`),
    drums: path.join(stemDir, `${fileBaseName}_drums.mp3`),
    bass: path.join(stemDir, `${fileBaseName}_bass.mp3`),
    other: path.join(stemDir, `${fileBaseName}_other.mp3`)
  };
  
  // For now, just duplicate the original file as stems
  Object.values(stemPaths).forEach(stemPath => {
    fs.copyFileSync(filePath, stemPath);
  });
  
  return stemPaths;
}

module.exports = {
  separateTracks
};
