
/**
 * Mixing Engine Module - Main entry point
 * Re-exports all functionality from specialized modules
 */

const { mixTracks } = require('./mixerCore');
const { convertWavToMp3 } = require('./mixerUtils');

module.exports = {
  mixTracks,
  convertWavToMp3
};
