
/**
 * Enhanced stem mixer module
 * Handles mixing processed stems together with improved quality
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { fallbackMixing } = require('./fallbackMixer');
const { createMixingFilter, prepareInputFilters } = require('./mixingFilters');

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
      let inputs = [];
      let stemCount = 0;
      
      // Add all inputs to the list
      Object.values(processedStems.track1).forEach(stemPath => {
        inputs.push(stemPath);
        stemCount++;
      });
      
      Object.values(processedStems.track2).forEach(stemPath => {
        inputs.push(stemPath);
        stemCount++;
      });
      
      // Prepare input filters and get stem labels
      const { filter: inputFilter, stemLabels, currentStemCount } = prepareInputFilters(stemCount, processedStems);
      
      // Create the full filter chain by combining the input filters with the mixing filter
      const mixingFilter = createMixingFilter(stemLabels, currentStemCount, settings, useHighQuality);
      const fullFilter = inputFilter + mixingFilter;
      
      // Create the FFmpeg command with better logging
      const command = ffmpeg();
      
      // Add each input
      inputs.forEach(input => {
        command.input(input);
      });
      
      // Set up filter and output format based on quality settings
      command
        .complexFilter(fullFilter, ['out'])
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

module.exports = {
  mixProcessedStems
};
