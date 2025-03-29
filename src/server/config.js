
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

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
OPENAI_API_KEY=""

# File storage configuration
MAX_FILE_SIZE_MB=25
UPLOAD_DIR="uploads"

# Python configuration
PYTHON_PATH="python3"
`;
  fs.writeFileSync(envPath, defaultEnv);
}

// Configuration object
const config = {
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  
  apiKeys: {
    claude: process.env.CLAUDE_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  },
  
  fileStorage: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
    uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads'),
    tempDir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads', 'temp'),
  },
  
  python: {
    path: process.env.PYTHON_PATH || 'python3',
    scriptDir: path.join(__dirname, 'python'),
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
