
const path = require('path');
const fs = require('fs');
const os = require('os');
const config = require('../config');

/**
 * System resource information for optimizing performance
 */
function getSystemResources() {
  try {
    const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10;
    const availableMemoryGB = Math.round(os.freemem() / (1024 * 1024 * 1024) * 10) / 10;
    const cpuCount = os.cpus().length;
    const isLowResourceSystem = totalMemoryGB < 4 || cpuCount < 2;
    
    return {
      totalMemoryGB,
      availableMemoryGB,
      cpuCount,
      platform: os.platform(),
      arch: os.arch(),
      isLowResourceSystem
    };
  } catch (error) {
    console.warn('Error detecting system resources:', error);
    return {
      isLowResourceSystem: true, // Default to conservative resource usage
      error: error.message
    };
  }
}

/**
 * Calculate optimal memory limits based on system resources
 */
function calculateMemoryLimits() {
  const resources = getSystemResources();
  
  // Set memory limits based on available system memory
  let heapLimitMB = 0;
  let processingChunkSizeMB = 0;
  
  if (resources.totalMemoryGB < 2) {
    heapLimitMB = 512;
    processingChunkSizeMB = 32;
  } else if (resources.totalMemoryGB < 4) {
    heapLimitMB = 1024;
    processingChunkSizeMB = 64;
  } else if (resources.totalMemoryGB < 8) {
    heapLimitMB = 2048;
    processingChunkSizeMB = 128;
  } else {
    heapLimitMB = 4096;
    processingChunkSizeMB = 256;
  }
  
  return {
    heapLimitMB,
    processingChunkSizeMB,
    environmentVariables: {
      NODE_OPTIONS: `--max-old-space-size=${heapLimitMB}`,
      MEMORY_LIMIT: `${heapLimitMB}M`
    }
  };
}

/**
 * Standardized path resolution
 */
const pathResolver = {
  /**
   * Get the application root directory
   */
  getAppRoot: () => {
    return process.env.NODE_ENV === 'development' 
      ? path.resolve(__dirname, '..', '..', '..') 
      : process.cwd();
  },
  
  /**
   * Get the server directory
   */
  getServerDir: () => {
    return path.resolve(__dirname, '..');
  },
  
  /**
   * Get Python scripts directory
   */
  getPythonScriptDir: () => {
    // First check the configured script directory
    const configuredDir = config.python.scriptDir;
    if (fs.existsSync(configuredDir)) {
      return configuredDir;
    }
    
    // Try to find the directory in standard locations
    const serverDir = pathResolver.getServerDir();
    const possiblePaths = [
      path.join(serverDir, 'python'),
      path.join(process.cwd(), 'src', 'server', 'python'),
      path.join(process.cwd(), 'server', 'python')
    ];
    
    for (const dir of possiblePaths) {
      if (fs.existsSync(dir)) {
        return dir;
      }
    }
    
    // Last resort, return the default path
    return path.join(serverDir, 'python');
  },
  
  /**
   * Resolve a Python script path
   * @param {string} scriptName - Script name without path
   * @returns {string} Full path to the script
   */
  resolvePythonScript: (scriptName) => {
    return path.join(pathResolver.getPythonScriptDir(), scriptName);
  },
  
  /**
   * Get upload directory path
   */
  getUploadDir: () => {
    return config.fileStorage.uploadDir;
  },
  
  /**
   * Get temp directory path
   */
  getTempDir: () => {
    return config.fileStorage.tempDir;
  },
  
  /**
   * Get path for a processed audio file
   * @param {string} filename - Base filename
   * @param {string} suffix - Optional suffix to add
   * @returns {string} Path to the file in the upload directory
   */
  getProcessedFilePath: (filename, suffix = '') => {
    const baseName = path.basename(filename, path.extname(filename));
    const ext = path.extname(filename) || '.mp3';
    const newName = suffix ? `${baseName}_${suffix}${ext}` : `${baseName}${ext}`;
    return path.join(pathResolver.getUploadDir(), newName);
  }
};

/**
 * File management utilities
 */
const fileManager = {
  /**
   * Ensure required directories exist
   */
  ensureDirectoriesExist: () => {
    const dirs = [
      pathResolver.getUploadDir(),
      pathResolver.getTempDir(),
      path.join(pathResolver.getUploadDir(), 'cache')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  },
  
  /**
   * Clean up temporary files
   * @param {string} directory - Directory to clean
   * @param {number} maxAgeHours - Maximum age in hours
   */
  cleanupTempFiles: (directory = null, maxAgeHours = 24) => {
    try {
      const dir = directory || pathResolver.getTempDir();
      if (!fs.existsSync(dir)) {
        return;
      }
      
      console.log(`Cleaning up temporary files in ${dir}`);
      
      const files = fs.readdirSync(dir);
      const now = new Date().getTime();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      
      let cleanedCount = 0;
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        
        try {
          const stats = fs.statSync(filePath);
          const fileAgeMs = now - stats.mtimeMs;
          
          if (fileAgeMs > maxAgeMs) {
            if (stats.isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true });
            } else {
              fs.unlinkSync(filePath);
            }
            cleanedCount++;
          }
        } catch (error) {
          console.warn(`Error cleaning up file ${filePath}:`, error.message);
        }
      });
      
      console.log(`Cleaned up ${cleanedCount} files/directories`);
    } catch (error) {
      console.error('Error during temp file cleanup:', error);
    }
  }
};

module.exports = {
  getSystemResources,
  calculateMemoryLimits,
  pathResolver,
  fileManager
};
