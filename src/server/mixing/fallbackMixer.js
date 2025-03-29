
/**
 * Fallback mixing module
 * Provides simpler mixing approach when advanced mixing fails
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

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
  fallbackMixing
};
