
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
CLAUDE_API_KEY="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"
OPENAI_API_KEY="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"

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
  
  apiKeys: {
    claude: process.env.CLAUDE_API_KEY || "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",
    openai: process.env.OPENAI_API_KEY || "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",
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
