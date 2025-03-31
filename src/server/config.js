
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const os = require('os');

// Load environment variables
dotenv.config();

// Determine the base directory
const isDev = process.env.NODE_ENV === 'development';
const rootDir = isDev ? path.resolve(__dirname, '..') : process.cwd();

// Create default .env file if it doesn't exist (in development only)
const envPath = path.join(__dirname, '.env');
if (isDev && !fs.existsSync(envPath)) {
  console.log('Creating default .env file...');
  const defaultEnv = `
# Server configuration
PORT=5000
NODE_ENV=development

# API Keys (replace with your own)
OPENAI_API_KEY=""

# File storage configuration
MAX_FILE_SIZE_MB=25
UPLOAD_DIR="uploads"

# Python configuration
PYTHON_PATH="python3"
`;
  fs.writeFileSync(envPath, defaultEnv);
}

// System resource configuration
const totalMemoryGB = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10;
const cpuCount = os.cpus().length;
const isLowResourceSystem = totalMemoryGB < 4 || cpuCount < 2;

// Configuration object
const config = {
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    isLowResourceSystem,
    systemInfo: {
      memory: totalMemoryGB,
      cpus: cpuCount,
      platform: os.platform(),
      arch: os.arch()
    }
  },
  
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || "",
  },
  
  fileStorage: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
    uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads'),
    tempDir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads', 'temp'),
  },
  
  python: {
    path: process.env.PYTHON_PATH || 'python3',
    scriptDir: path.join(__dirname, 'python'),
    fallbacks: {
      useFallbackAnalysis: process.env.USE_FALLBACK_ANALYSIS === 'true' || isLowResourceSystem,
      useLightStemSeparation: process.env.USE_LIGHT_STEM_SEPARATION === 'true' || isLowResourceSystem
    }
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  }
};

// Create directories if they don't exist
function ensureDirectoriesExist() {
  [config.fileStorage.uploadDir, config.fileStorage.tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

ensureDirectoriesExist();

module.exports = config;
