const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { nanoid } = require('nanoid');
const { separateTracks } = require('./audio');

/**
 * Mix two audio tracks together based on provided settings
 * @param {string} track1Path Path to the first audio track
 * @param {string} track2Path Path to the second audio track
 * @param {Object} settings Mixing settings
 * @param {string} outputPath Path for the output mixed file
 * @returns {Promise<Object>} Result of the mixing process
 */
async function mixTracks(track1Path, track2Path, settings, outputPath) {
  try {
    console.log('Starting mix process with settings:', settings);
    
    // Create temporary working directory
    const tempDir = path.join(path.dirname(outputPath), 'tmp', nanoid());
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
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
      ...settings
    };
    
    // Step 1: Separate stems for both tracks
    console.log('Separating stems for tracks...');
    const [track1Stems, track2Stems] = await Promise.all([
      separateTracks(track1Path),
      separateTracks(track2Path)
    ]);
    
    // Step 2: Process stems based on settings
    console.log('Processing stems...');
    const processedStems = await processStems(track1Stems, track2Stems, mixSettings, tempDir);
    
    // Step 3: Apply BPM matching if enabled
    if (mixSettings.bpmMatch) {
      console.log('Applying BPM matching...');
      await matchBPM(processedStems, mixSettings, tempDir);
    }
    
    // Step 4: Mix all processed stems together
    console.log('Mixing processed stems...');
    await mixProcessedStems(processedStems, mixSettings, outputPath);
    
    // Step 5: Apply final effects
    console.log('Applying final effects...');
    await applyFinalEffects(outputPath, mixSettings);
    
    // Clean up temporary files
    cleanupTempFiles(tempDir);
    
    return {
      success: true,
      outputPath,
      settings: mixSettings
    };
  } catch (error) {
    console.error('Mixing error:', error);
    throw new Error(`Failed to mix tracks: ${error.message}`);
  }
}

/**
 * Process individual stems based on mix settings
 * @param {Object} track1Stems Stems from track 1
 * @param {Object} track2Stems Stems from track 2
 * @param {Object} settings Mixing settings
 * @param {string} tempDir Temporary directory for processing
 * @returns {Promise<Object>} Processed stems
 */
async function processStems(track1Stems, track2Stems, settings, tempDir) {
  // Create output paths for processed stems
  const processedStems = {
    track1: {
      vocals: path.join(tempDir, 'track1_vocals_processed.wav'),
      drums: path.join(tempDir, 'track1_drums_processed.wav'),
      bass: path.join(tempDir, 'track1_bass_processed.wav'),
      other: path.join(tempDir, 'track1_other_processed.wav')
    },
    track2: {
      vocals: path.join(tempDir, 'track2_vocals_processed.wav'),
      drums: path.join(tempDir, 'track2_drums_processed.wav'),
      bass: path.join(tempDir, 'track2_bass_processed.wav'),
      other: path.join(tempDir, 'track2_other_processed.wav')
    }
  };
  
  // Process each stem with appropriate volume levels
  const processingPromises = [];
  
  // Process track 1 stems
  processingPromises.push(
    processAudioStem(track1Stems.vocals, processedStems.track1.vocals, settings.vocalLevel1),
    processAudioStem(track1Stems.drums, processedStems.track1.drums, settings.beatLevel1),
    processAudioStem(track1Stems.bass, processedStems.track1.bass, settings.beatLevel1),
    processAudioStem(track1Stems.other, processedStems.track1.other, settings.beatLevel1)
  );
  
  // Process track 2 stems
  processingPromises.push(
    processAudioStem(track2Stems.vocals, processedStems.track2.vocals, settings.vocalLevel2),
    processAudioStem(track2Stems.drums, processedStems.track2.drums, settings.beatLevel2),
    processAudioStem(track2Stems.bass, processedStems.track2.bass, settings.beatLevel2),
    processAudioStem(track2Stems.other, processedStems.track2.other, settings.beatLevel2)
  );
  
  await Promise.all(processingPromises);
  return processedStems;
}

/**
 * Process an individual audio stem with specified volume
 * @param {string} inputPath Input stem path
 * @param {string} outputPath Output stem path
 * @param {number} volumeLevel Volume level (0-1)
 * @returns {Promise<void>}
 */
async function processAudioStem(inputPath, outputPath, volumeLevel) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`volume=${volumeLevel}`)
      .saveToFile(outputPath)
      .on('error', err => reject(err))
      .on('end', () => resolve());
  });
}

/**
 * Match BPM between tracks
 * @param {Object} processedStems Processed stems
 * @param {Object} settings Mixing settings
 * @param {string} tempDir Temporary directory
 * @returns {Promise<void>}
 */
async function matchBPM(processedStems, settings, tempDir) {
  // For demonstration, we'll adjust track2 to match track1's BPM
  // In a real implementation, this would use the actual BPM values
  const tempoFactor = 1 + (settings.tempo || 0);
  
  const processingPromises = [];
  
  // Adjust tempo for track 2 stems
  Object.keys(processedStems.track2).forEach(stemType => {
    const stemPath = processedStems.track2[stemType];
    const outputPath = path.join(tempDir, `track2_${stemType}_tempo.wav`);
    
    processingPromises.push(
      new Promise((resolve, reject) => {
        ffmpeg(stemPath)
          .audioFilters(`atempo=${tempoFactor}`)
          .saveToFile(outputPath)
          .on('error', err => reject(err))
          .on('end', () => {
            // Replace the original processed stem with the tempo-adjusted one
            fs.copyFileSync(outputPath, stemPath);
            resolve();
          });
      })
    );
  });
  
  await Promise.all(processingPromises);
}

/**
 * Mix all processed stems together
 * @param {Object} processedStems Processed stems
 * @param {Object} settings Mixing settings
 * @param {string} outputPath Output path for mixed file
 * @returns {Promise<void>}
 */
async function mixProcessedStems(processedStems, settings, outputPath) {
  return new Promise((resolve, reject) => {
    // Create a complex filter for mixing all stems
    let filter = '';
    let inputs = [];
    let stemCount = 0;
    
    // Add all track1 stems
    Object.values(processedStems.track1).forEach(stemPath => {
      inputs.push(stemPath);
      filter += `[${stemCount}:a]`;
      stemCount++;
    });
    
    // Add all track2 stems
    Object.values(processedStems.track2).forEach(stemPath => {
      inputs.push(stemPath);
      filter += `[${stemCount}:a]`;
      stemCount++;
    });
    
    // Create the mix with crossfade
    filter += `amix=inputs=${stemCount}:duration=longest:dropout_transition=${settings.crossfadeLength}[out]`;
    
    // Create the FFmpeg command
    const command = ffmpeg();
    
    // Add each input
    inputs.forEach(input => {
      command.input(input);
    });
    
    // Set up the filter and output
    command
      .complexFilter(filter, ['out'])
      .map('[out]')
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .on('error', err => reject(err))
      .on('end', () => resolve())
      .saveToFile(outputPath);
  });
}

/**
 * Apply final effects to the mixed track
 * @param {string} filePath Path to the mixed file
 * @param {Object} settings Mixing settings
 * @returns {Promise<void>}
 */
async function applyFinalEffects(filePath, settings) {
  // Create a temporary file for the processed output
  const tempPath = `${filePath}.temp.mp3`;
  
  return new Promise((resolve, reject) => {
    // Build audio filters based on settings
    const filters = [];
    
    // Add echo if specified
    if (settings.echo > 0) {
      filters.push(`aecho=0.8:0.88:${Math.round(settings.echo * 1000)}:0.5`);
    }
    
    // Add other filters as needed
    if (filters.length === 0) {
      // No effects to apply
      resolve();
      return;
    }
    
    ffmpeg(filePath)
      .audioFilters(filters)
      .saveToFile(tempPath)
      .on('error', err => reject(err))
      .on('end', () => {
        // Replace the original file with the effects-applied version
        fs.copyFileSync(tempPath, filePath);
        fs.unlinkSync(tempPath);
        resolve();
      });
  });
}

/**
 * Clean up temporary files
 * @param {string} tempDir Temporary directory
 */
function cleanupTempFiles(tempDir) {
  try {
    if (fs.existsSync(tempDir)) {
      fs.readdirSync(tempDir).forEach(file => {
        const filePath = path.join(tempDir, file);
        fs.unlinkSync(filePath);
      });
      fs.rmdirSync(tempDir);
    }
  } catch (error) {
    console.warn('Error cleaning up temp files:', error);
  }
}

module.exports = {
  mixTracks
};
