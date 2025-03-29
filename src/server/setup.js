
const fs = require('fs');
const path = require('path');
const { spawn } = require('cross-spawn');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define paths
const serverDir = __dirname;
const pythonDir = path.join(serverDir, 'python');
const uploadsDir = path.join(serverDir, '../uploads');
const tempDir = path.join(uploadsDir, 'temp');

// Create necessary directories
function createDirectories() {
  console.log('Creating necessary directories...');
  [uploadsDir, tempDir, path.join(uploadsDir, 'stems')].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Check Node.js dependencies
function checkNodeDependencies() {
  console.log('Checking Node.js dependencies...');
  
  try {
    const packageJson = require('./package.json');
    const missingDeps = [];
    
    const requiredDeps = [
      '@ffmpeg/ffmpeg', 'cors', 'dotenv', 'express', 'fluent-ffmpeg', 
      'meyda', 'multer', 'nanoid', 'openai', 'python-shell', 'cross-spawn'
    ];
    
    requiredDeps.forEach(dep => {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        missingDeps.push(dep);
      }
    });
    
    if (missingDeps.length > 0) {
      console.error('Missing Node.js dependencies:', missingDeps.join(', '));
      console.log('Please install them using: npm install ' + missingDeps.join(' '));
      return false;
    }
    
    console.log('All Node.js dependencies are installed.');
    return true;
  } catch (error) {
    console.error('Error checking Node.js dependencies:', error);
    return false;
  }
}

// Check Python and its dependencies
function checkPythonEnvironment() {
  return new Promise((resolve) => {
    console.log('Checking Python environment...');
    
    // Check if Python is installed
    const pythonProcess = spawn('python3', ['--version']);
    
    pythonProcess.on('error', () => {
      console.error('Python 3 is not installed or not in PATH.');
      console.log('Please install Python 3 and try again.');
      resolve(false);
    });
    
    pythonProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error('Python 3 check failed.');
        resolve(false);
        return;
      }
      
      // Check pip installation
      const pipProcess = spawn('pip3', ['--version']);
      
      pipProcess.on('error', () => {
        console.error('pip3 is not installed or not in PATH.');
        console.log('Please install pip for Python 3 and try again.');
        resolve(false);
      });
      
      pipProcess.on('exit', (pipCode) => {
        if (pipCode !== 0) {
          console.error('pip3 check failed.');
          resolve(false);
          return;
        }
        
        console.log('Python and pip are properly installed.');
        
        // Install required Python packages
        installPythonDependencies().then(resolve);
      });
    });
  });
}

// Install Python dependencies
function installPythonDependencies() {
  return new Promise((resolve) => {
    console.log('Installing Python dependencies...');
    
    // Read requirements from file
    const requirementsPath = path.join(serverDir, 'requirements.txt');
    
    if (!fs.existsSync(requirementsPath)) {
      console.error('requirements.txt not found.');
      resolve(false);
      return;
    }
    
    // Install requirements
    const pipInstall = spawn('pip3', ['install', '-r', requirementsPath]);
    
    pipInstall.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    pipInstall.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    pipInstall.on('error', (err) => {
      console.error('Failed to install Python dependencies:', err);
      resolve(false);
    });
    
    pipInstall.on('exit', (code) => {
      if (code !== 0) {
        console.error('Python dependencies installation failed with code:', code);
        resolve(false);
        return;
      }
      
      console.log('Python dependencies installed successfully.');
      resolve(true);
    });
  });
}

// Check if FFmpeg is installed
function checkFFmpeg() {
  return new Promise((resolve) => {
    console.log('Checking FFmpeg installation...');
    
    const ffmpegProcess = spawn('ffmpeg', ['-version']);
    
    ffmpegProcess.on('error', () => {
      console.error('FFmpeg is not installed or not in PATH.');
      console.log('Please install FFmpeg and try again.');
      resolve(false);
    });
    
    ffmpegProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error('FFmpeg check failed.');
        resolve(false);
        return;
      }
      
      console.log('FFmpeg is properly installed.');
      resolve(true);
    });
  });
}

// Run all checks
async function runSetup() {
  console.log('Starting Audio Mixer backend setup...');
  
  createDirectories();
  
  const nodeResult = checkNodeDependencies();
  if (!nodeResult) {
    console.error('Node.js dependency check failed.');
    process.exit(1);
  }
  
  const ffmpegResult = await checkFFmpeg();
  if (!ffmpegResult) {
    console.error('FFmpeg check failed.');
    process.exit(1);
  }
  
  const pythonResult = await checkPythonEnvironment();
  if (!pythonResult) {
    console.error('Python environment check failed.');
    process.exit(1);
  }
  
  console.log('Setup completed successfully! You can now run the server.');
}

// Run setup if this script is executed directly
if (require.main === module) {
  runSetup();
}

module.exports = {
  runSetup,
  checkNodeDependencies,
  checkPythonEnvironment,
  checkFFmpeg
};
