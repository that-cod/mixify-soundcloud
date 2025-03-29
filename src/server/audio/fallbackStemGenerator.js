
/**
 * Fallback stem generator
 * Creates fallback stems when separation fails
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Create fallback stems when separation fails
 * @param {string} filePath Original audio file
 * @param {string} outputDir Output directory
 * @returns {Promise<Object>} Paths to created stems
 */
async function createFallbackStems(filePath, outputDir) {
  console.log(`Creating fallback stems for ${path.basename(filePath)}`);
  
  try {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Define stem types
    const stemTypes = ['vocals', 'drums', 'bass', 'other'];
    const fallbackStems = {};
    
    // Basic FFmpeg command to create stem copies
    const ffmpegPath = 'ffmpeg'; // Assuming ffmpeg is in PATH
    
    for (const stemType of stemTypes) {
      const outputPath = path.join(outputDir, `${stemType}.mp3`);
      fallbackStems[stemType] = outputPath;
      
      try {
        // Create a copy of the original file with different filtering based on stem type
        let filter = '';
        
        switch (stemType) {
          case 'vocals':
            // Enhance mid frequencies for vocals fallback
            filter = 'equalizer=f=1000:width_type=o:width=300:g=2';
            break;
          case 'drums':
            // Enhance low frequencies for drums fallback
            filter = 'equalizer=f=100:width_type=o:width=200:g=2';
            break;
          case 'bass':
            // Enhance very low frequencies for bass fallback
            filter = 'equalizer=f=60:width_type=o:width=100:g=3';
            break;
          case 'other':
            // Enhance high frequencies for other instruments
            filter = 'equalizer=f=5000:width_type=o:width=1000:g=1';
            break;
        }
        
        // Execute FFmpeg command
        const command = `${ffmpegPath} -i "${filePath}" -af "${filter}" -codec:a libmp3lame -qscale:a 2 "${outputPath}" -y`;
        execSync(command, { stdio: 'ignore' });
        
        // Verify the file was created
        if (!fs.existsSync(outputPath)) {
          throw new Error(`Failed to create ${stemType} fallback stem`);
        }
      } catch (ffmpegError) {
        console.error(`Error creating fallback stem for ${stemType}:`, ffmpegError);
        
        // If FFmpeg fails, just copy the file
        try {
          fs.copyFileSync(filePath, outputPath);
        } catch (copyError) {
          console.error(`Fallback copy failed:`, copyError);
          // Last resort - point to the original file
          fallbackStems[stemType] = filePath;
        }
      }
    }
    
    return fallbackStems;
  } catch (error) {
    console.error(`Fallback stem creation failed:`, error);
    
    // Ultimate fallback - just return the original file for all stems
    return {
      vocals: filePath,
      drums: filePath,
      bass: filePath,
      other: filePath
    };
  }
}

module.exports = {
  createFallbackStems
};
