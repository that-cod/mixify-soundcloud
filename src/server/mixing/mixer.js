
/**
 * Main mixing module
 * Coordinates the mixing process and integrates all sub-modules
 */

const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const { separateTracks } = require('../audio');
const { processStems } = require('./stemProcessor');
const { matchBPM } = require('./bpmMatcher');
const { mixProcessedStems } = require('./stemMixer');
const { applyFinalEffects } = require('./effectsProcessor');
const { cleanupTempFiles } = require('./utils');
const { shouldUseLightMode } = require('../audio/processor');
const os = require('os');
const config = require('../config');
const { pathResolver, getSystemResources } = require('../utils/systemUtils');

/**
 * Mix two audio tracks together based on provided settings
 * @param {string} track1Path Path to the first audio track
 * @param {string} track2Path Path to the second audio track
 * @param {Object} settings Mixing settings
 * @param {string} outputPath Path for the output mixed file
 * @returns {Promise<Object>} Result of the mixing process
 */
async function mixTracks(track1Path, track2Path, settings, outputPath) {
  let tempDir = null;
  const startTime = Date.now();
  
  try {
    console.log('Starting mix process with settings:', settings);
    
    // Standardize file paths using pathResolver
    track1Path = pathResolver.resolveFilePath(track1Path);
    track2Path = pathResolver.resolveFilePath(track2Path);
    outputPath = pathResolver.resolveFilePath(outputPath);
    
    // Validate input files exist
    if (!fs.existsSync(track1Path)) {
      throw new Error(`Track 1 file not found: ${track1Path}`);
    }
    
    if (!fs.existsSync(track2Path)) {
      throw new Error(`Track 2 file not found: ${track2Path}`);
    }
    
    // Check system resources and set optimization level
    const resources = getSystemResources();
    const lightMode = shouldUseLightMode() || resources.isLowResourceSystem;
    console.log(`System resources detected: ${resources.totalMemoryGB}GB RAM, ${resources.cpuCount} CPUs`);
    console.log(`Using ${lightMode ? 'light' : 'standard'} mixing mode`);
    
    // Create temporary working directory in a standardized location
    const tempBaseDir = settings.tempDir || pathResolver.getTempDir();
    tempDir = path.join(tempBaseDir, 'mixify-tmp', nanoid());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Default settings if none provided
    const mixSettings = {
      bpmMatch: true,
      keyMatch: true,
      vocalLevel1: 0.8,
      vocalLevel2: 0.5,
      beatLevel1: 0.6,
      beatLevel2: 0.8,
      crossfadeLength: 8,
      echo: 0.2,
      tempo: 0,
      optimizationLevel: lightMode ? 'light' : 'standard',
      advancedProcessing: !lightMode, // Enable advanced processing for standard mode
      highQualityOutput: !lightMode, // Enable high quality output for standard mode
      eqSettings: {
        // Default EQ settings for better sound quality
        bass: 0.5,
        mid: 0.5,
        treble: 0.5
      },
      enhanceClarity: true, // Enable clarity enhancement
      normalizeLoudness: true, // Enable loudness normalization
      preserveDynamics: true, // Preserve dynamic range
      intelligentGainStaging: true, // Better gain staging for cleaner mixes
      ...settings
    };
    
    // Log start of process with clear identifiers
    console.log(`=== Starting mix for tracks ===`);
    console.log(`Track 1: ${path.basename(track1Path)}`);
    console.log(`Track 2: ${path.basename(track2Path)}`);
    console.log(`Output: ${path.basename(outputPath)}`);
    console.log(`Temp dir: ${tempDir}`);
    console.log(`Mode: ${mixSettings.optimizationLevel}`);
    
    // Adjust quality settings based on optimization level
    if (mixSettings.optimizationLevel === 'light') {
      console.log('Using light optimization: some features may be simplified');
      // Simplify processing for light mode
      mixSettings.advancedProcessing = false;
      mixSettings.highQualityOutput = false;
      mixSettings.preserveDynamics = false;
      
      // Simplify BPM matching for light mode
      if (mixSettings.bpmMatch && Math.abs(mixSettings.tempo) > 0.2) {
        console.log('Limiting tempo adjustment in light mode');
        mixSettings.tempo = Math.sign(mixSettings.tempo) * 0.2;
      }
    }
    
    // Create unique cache directories for stems
    const cacheDir = path.join(pathResolver.getUploadDir(), 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const track1StemCachePath = path.join(cacheDir, `track1_${path.basename(track1Path).split('.')[0]}_stems.json`);
    const track2StemCachePath = path.join(cacheDir, `track2_${path.basename(track2Path).split('.')[0]}_stems.json`);
    
    // Step 1: Separate stems for both tracks
    console.log('Separating stems for tracks...');
    let track1Stems, track2Stems;
    
    try {
      const separationOptions = {
        outputDir: tempDir,
        lightMode: mixSettings.optimizationLevel === 'light',
        highQuality: mixSettings.highQualityOutput,
        useCache: true
      };
      
      [track1Stems, track2Stems] = await Promise.all([
        separateTracks(track1Path, {
          ...separationOptions,
          outputDir: path.join(tempDir, 'track1'),
          cachePath: track1StemCachePath
        }),
        separateTracks(track2Path, {
          ...separationOptions,
          outputDir: path.join(tempDir, 'track2'),
          cachePath: track2StemCachePath
        })
      ]);
      
      // Verify we have valid stems
      if (!track1Stems || !track2Stems) {
        throw new Error("Stem separation failed for one or both tracks");
      }
      
      // Check that all required stem types exist
      const requiredStems = ['vocals', 'drums', 'bass', 'other'];
      for (const stem of requiredStems) {
        if (!track1Stems[stem] || !track2Stems[stem]) {
          throw new Error(`Missing ${stem} stem for one or both tracks`);
        }
      }
    } catch (separationError) {
      console.error('Error during stem separation:', separationError);
      throw new Error(`Failed to separate stems: ${separationError.message}`);
    }
    
    // Step 2: Process stems based on settings with enhanced quality
    console.log('Processing stems with enhanced quality...');
    let processedStems;
    try {
      processedStems = await processStems(track1Stems, track2Stems, mixSettings, tempDir);
    } catch (processingError) {
      console.error('Error during stem processing:', processingError);
      throw new Error(`Failed to process stems: ${processingError.message}`);
    }
    
    // Step 3: Apply BPM matching with improved algorithm if enabled
    if (mixSettings.bpmMatch && mixSettings.optimizationLevel !== 'ultra-light') {
      console.log('Applying enhanced BPM matching...');
      try {
        await matchBPM(processedStems, mixSettings, tempDir);
      } catch (bpmError) {
        console.error('Error during BPM matching:', bpmError);
        console.log('Continuing without BPM matching');
        // Continue despite BPM matching failure
      }
    }
    
    // Step 4: Mix all processed stems together with enhanced algorithms
    console.log('Mixing processed stems with enhanced quality...');
    const preMixPath = path.join(tempDir, 'pre_effects_mix.wav'); // Use WAV for better quality
    try {
      await mixProcessedStems(processedStems, mixSettings, preMixPath);
    } catch (mixingError) {
      console.error('Error during stem mixing:', mixingError);
      throw new Error(`Failed to mix stems: ${mixingError.message}`);
    }
    
    // Step 5: Apply final effects with advanced quality processing
    console.log('Applying enhanced final effects...');
    try {
      // Use high quality format for processing if enabled
      const useHighQuality = mixSettings.highQualityOutput && mixSettings.optimizationLevel !== 'light';
      const finalFormat = useHighQuality ? 'wav' : 'mp3';
      const finalBitrate = useHighQuality ? '1411k' : '320k';
      
      const effectsOptions = {
        format: finalFormat,
        bitrate: finalBitrate,
        sampleRate: useHighQuality ? 48000 : 44100,
        normalizeLoudness: mixSettings.normalizeLoudness,
        preserveDynamics: mixSettings.preserveDynamics,
        enhanceClarity: mixSettings.enhanceClarity,
        eqSettings: mixSettings.eqSettings
      };
      
      // Apply effects with quality settings
      await applyFinalEffects(preMixPath, outputPath, {
        ...mixSettings,
        ...effectsOptions
      });
      
      // Verify the output file exists
      if (!fs.existsSync(outputPath)) {
        throw new Error("Final output file was not created");
      }
    } catch (effectsError) {
      console.error('Error applying final effects:', effectsError);
      
      // Fallback - if effects failed, try to use the pre-effects mix
      const preEffectsPath = path.join(tempDir, 'pre_effects_mix.wav');
      if (fs.existsSync(preEffectsPath)) {
        console.log('Using pre-effects mix as fallback');
        // Convert WAV to MP3 if needed
        if (path.extname(outputPath).toLowerCase() === '.mp3' && path.extname(preEffectsPath).toLowerCase() === '.wav') {
          await convertWavToMp3(preEffectsPath, outputPath);
        } else {
          fs.copyFileSync(preEffectsPath, outputPath);
        }
      } else {
        throw new Error(`Failed to apply effects and no fallback available: ${effectsError.message}`);
      }
    }
    
    // Calculate processing time
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Successful completion
    console.log(`=== Mix completed successfully in ${processingTime} seconds ===`);
    console.log(`Output file: ${outputPath}`);
    
    // Clean up temporary files
    if (!settings.keepTempFiles) {
      console.log('Cleaning up temporary files...');
      try {
        cleanupTempFiles(tempDir);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp files:', cleanupError);
      }
    }
    
    return {
      success: true,
      outputPath,
      settings: mixSettings,
      optimizationLevel: mixSettings.optimizationLevel,
      processingTime: parseFloat(processingTime)
    };
  } catch (error) {
    console.error('Mixing error:', error);
    
    // Additional detailed error logging
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    // Clean up temporary files on error
    if (tempDir && fs.existsSync(tempDir) && !settings.keepTempFiles) {
      try {
        cleanupTempFiles(tempDir);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp files after error:', cleanupError);
      }
    }
    
    throw new Error(`Failed to mix tracks: ${error.message}`);
  }
}

/**
 * Convert WAV file to MP3 format
 * @param {string} wavPath Path to WAV file
 * @param {string} mp3Path Output MP3 path
 * @returns {Promise<void>}
 */
async function convertWavToMp3(wavPath, mp3Path) {
  return new Promise((resolve, reject) => {
    const ffmpeg = require('fluent-ffmpeg');
    
    ffmpeg(wavPath)
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .on('error', err => reject(err))
      .on('end', () => resolve())
      .save(mp3Path);
  });
}

module.exports = {
  mixTracks
};
