
/**
 * Stem mixer module
 * Handles mixing processed stems together
 */

const ffmpeg = require('fluent-ffmpeg');

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

module.exports = {
  mixProcessedStems
};
