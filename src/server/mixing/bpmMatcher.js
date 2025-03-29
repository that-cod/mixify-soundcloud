
/**
 * BPM matching module
 * Handles tempo adjustment between tracks
 */

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

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

module.exports = {
  matchBPM
};
