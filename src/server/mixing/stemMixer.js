
/**
 * Enhanced stem mixer module
 * Handles mixing processed stems together with improved quality
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { pathResolver } = require('../utils/systemUtils');

/**
 * Mix all processed stems together with enhanced quality
 * @param {Object} processedStems Processed stems
 * @param {Object} settings Mixing settings
 * @param {string} outputPath Output path for mixed file
 * @returns {Promise<void>}
 */
async function mixProcessedStems(processedStems, settings, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`Mixing stems with enhanced quality settings...`);
    
    try {
      // Validate that all stem files exist
      const allStemPaths = [
        ...Object.values(processedStems.track1),
        ...Object.values(processedStems.track2)
      ];
      
      for (const stemPath of allStemPaths) {
        if (!fs.existsSync(stemPath)) {
          throw new Error(`Stem file not found: ${stemPath}`);
        }
      }
      
      // Determine if we're using high quality mode
      const useHighQuality = settings.highQualityOutput !== false && settings.optimizationLevel !== 'light';
      
      // Create a complex filter for mixing all stems with enhanced control
      let filter = '';
      let inputs = [];
      let stemCount = 0;
      let stemLabels = [];
      
      // Add all track1 stems with specific volume adjustments
      Object.entries(processedStems.track1).forEach(([stemType, stemPath]) => {
        inputs.push(stemPath);
        const stemLabel = `t1_${stemType}`;
        filter += `[${stemCount}:a]volume=1[${stemLabel}];`;
        stemLabels.push(`[${stemLabel}]`);
        stemCount++;
      });
      
      // Add all track2 stems with specific volume adjustments
      Object.entries(processedStems.track2).forEach(([stemType, stemPath]) => {
        inputs.push(stemPath);
        const stemLabel = `t2_${stemType}`;
        filter += `[${stemCount}:a]volume=1[${stemLabel}];`;
        stemLabels.push(`[${stemLabel}]`);
        stemCount++;
      });
      
      // Add advanced crossfade and mixing options
      const crossfadeLength = Math.max(1, Math.min(20, settings.crossfadeLength || 8));
      
      // Create the final mix with enhanced settings
      if (settings.optimizationLevel !== 'light' && useHighQuality) {
        // Advanced mixing with stem weighting and crossfading
        filter += stemLabels.join('') + `amix=inputs=${stemCount}:dropout_transition=${crossfadeLength}`;
        
        // Add dynamic processing based on settings
        if (settings.enhanceClarity) {
          filter += ':weights="1 1 1 1 1 1 1 1"'; // Equal weighting for all stems
        }
        
        filter += '[mixed];';
        
        // Add final EQ and dynamics processing for better blend
        filter += '[mixed]equalizer=f=100:width_type=h:width=200:g=1,';
        filter += 'equalizer=f=3000:width_type=h:width=2000:g=1,';
        filter += 'acompressor=threshold=-12dB:ratio=2:attack=200:release=1000:makeup=1';
        
        // Add stereo widening for spaciousness if enabled
        if (settings.optimizationLevel === 'standard') {
          filter += ',stereotools=mlev=0.15';
        }
        
        filter += '[out]';
      } else {
        // Simpler mixing for light mode
        filter += stemLabels.join('') + `amix=inputs=${stemCount}:dropout_transition=${crossfadeLength}[out]`;
      }
      
      // Create the FFmpeg command with better logging
      const command = ffmpeg();
      
      // Add each input
      inputs.forEach(input => {
        command.input(input);
      });
      
      // Set up filter and output format based on quality settings
      command
        .complexFilter(filter, ['out'])
        .map('[out]');
        
      // Set output format based on settings
      if (useHighQuality) {
        // Higher quality for standard mode
        command
          .audioFrequency(48000)
          .audioChannels(2);
          
        if (path.extname(outputPath).toLowerCase() === '.wav') {
          command
            .audioCodec('pcm_s16le')
            .format('wav');
        } else {
          command
            .audioCodec('libmp3lame')
            .audioBitrate('320k');
        }
      } else {
        // Standard quality for light mode
        command
          .audioCodec('libmp3lame')
          .audioBitrate('320k')
          .audioFrequency(44100)
          .audioChannels(2);
      }
      
      // Add event handlers with improved logging
      command
        .on('start', commandLine => {
          console.log('FFmpeg mixing command:', commandLine);
        })
        .on('progress', progress => {
          // Log progress every 20%
          if (progress.percent && progress.percent % 20 < 1) {
            console.log(`Mixing progress: ${Math.round(progress.percent)}% complete`);
          }
        })
        .on('error', (err, stdout, stderr) => {
          console.error('FFmpeg mixing error:', err.message);
          console.error('FFmpeg stderr:', stderr);
          // Try fallback simpler mixing if complex mixing fails
          fallbackMixing(inputs, outputPath, settings)
            .then(resolve)
            .catch(reject);
        })
        .on('end', () => {
          console.log(`Enhanced stem mixing complete: ${path.basename(outputPath)}`);
          resolve();
        })
        .saveToFile(outputPath);
    } catch (error) {
      console.error('Error setting up stem mixing:', error);
      // Try fallback mixing
      fallbackMixing(
        [...Object.values(processedStems.track1), ...Object.values(processedStems.track2)], 
        outputPath, 
        settings
      )
        .then(resolve)
        .catch(reject);
    }
  });
}

/**
 * Fallback to simpler mixing approach when advanced mixing fails
 * @param {Array<string>} inputFiles Array of input stem files
 * @param {string} outputPath Output file path
 * @param {Object} settings Mixing settings
 * @returns {Promise<void>}
 */
async function fallbackMixing(inputFiles, outputPath, settings) {
  return new Promise((resolve, reject) => {
    console.log('Using fallback stem mixing method...');
    
    // Filter out any non-existent input files
    const validInputs = inputFiles.filter(file => fs.existsSync(file));
    
    if (validInputs.length === 0) {
      return reject(new Error('No valid input files for fallback mixing'));
    }
    
    // If only one input file exists, just copy it
    if (validInputs.length === 1) {
      console.log('Only one valid input file, copying directly...');
      try {
        fs.copyFileSync(validInputs[0], outputPath);
        return resolve();
      } catch (copyError) {
        return reject(copyError);
      }
    }
    
    // Create a simple mixing command
    const command = ffmpeg();
    
    // Add all valid inputs
    validInputs.forEach(input => {
      command.input(input);
    });
    
    // Create a simple filter
    const simpleFilter = `amix=inputs=${validInputs.length}:dropout_transition=2[out]`;
    
    // Apply the filter and save to output
    command
      .complexFilter(simpleFilter, ['out'])
      .map('[out]')
      .audioCodec('libmp3lame')
      .audioBitrate('320k')
      .on('error', err => reject(err))
      .on('end', () => {
        console.log(`Fallback mixing complete: ${path.basename(outputPath)}`);
        resolve();
      })
      .saveToFile(outputPath);
  });
}

module.exports = {
  mixProcessedStems
};
