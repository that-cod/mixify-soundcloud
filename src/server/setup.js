
const fs = require('fs');
const path = require('path');
const { spawn } = require('cross-spawn');
const dotenv = require('dotenv');
const os = require('os');

// Load environment variables
dotenv.config();

// Define paths
const serverDir = __dirname;
const pythonDir = path.join(serverDir, 'python');
const uploadsDir = path.join(serverDir, '../uploads');
const tempDir = path.join(uploadsDir, 'temp');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// System resources
const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
const cpuCount = os.cpus().length;
const isLowResourceSystem = totalMemoryGB < 4 || cpuCount < 2;

// Create necessary directories
function createDirectories() {
  console.log(`${colors.blue}Creating necessary directories...${colors.reset}`);
  [uploadsDir, tempDir, path.join(uploadsDir, 'stems')].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`${colors.green}Created directory: ${dir}${colors.reset}`);
    }
  });
}

// Check Node.js dependencies
function checkNodeDependencies() {
  console.log(`${colors.blue}Checking Node.js dependencies...${colors.reset}`);
  
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
      console.error(`${colors.red}Missing Node.js dependencies: ${missingDeps.join(', ')}${colors.reset}`);
      console.log(`Please install them using: npm install ${missingDeps.join(' ')}`);
      return false;
    }
    
    console.log(`${colors.green}All Node.js dependencies are installed.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error checking Node.js dependencies: ${error}${colors.reset}`);
    return false;
  }
}

// Check Python and its dependencies
function checkPythonEnvironment() {
  return new Promise((resolve) => {
    console.log(`${colors.blue}Checking Python environment...${colors.reset}`);
    
    // Check system resources
    if (isLowResourceSystem) {
      console.log(`${colors.yellow}Running on a system with limited resources (${totalMemoryGB.toFixed(1)}GB RAM, ${cpuCount} CPUs).${colors.reset}`);
      console.log(`${colors.yellow}Some features may be automatically optimized for performance.${colors.reset}`);
    }
    
    // Check if Python is installed
    const pythonProcess = spawn('python3', ['--version']);
    
    pythonProcess.on('error', () => {
      // Try with python command if python3 fails
      const pythonFallback = spawn('python', ['--version']);
      
      pythonFallback.on('error', () => {
        console.error(`${colors.red}Python is not installed or not in PATH.${colors.reset}`);
        console.log(`${colors.yellow}Please install Python 3 and try again.${colors.reset}`);
        resolve(false);
      });
      
      pythonFallback.on('exit', (code) => {
        if (code !== 0) {
          console.error(`${colors.red}Python check failed.${colors.reset}`);
          resolve(false);
          return;
        }
        
        checkPythonDependencies('python').then(resolve);
      });
    });
    
    pythonProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`${colors.red}Python 3 check failed.${colors.reset}`);
        resolve(false);
        return;
      }
      
      checkPythonDependencies('python3').then(resolve);
    });
  });
}

// Check Python dependencies in detail
function checkPythonDependencies(pythonCommand) {
  return new Promise((resolve) => {
    console.log(`${colors.blue}Checking Python dependencies...${colors.reset}`);
    
    // Create a simple script to check all required packages
    const checkScript = `
import sys
import importlib.util
import json

required_packages = [
    "librosa", "numpy", "scipy", "spleeter", 
    "tensorflow", "pydub", "soundfile", "tqdm"
]

results = {}

for package in required_packages:
    spec = importlib.util.find_spec(package)
    is_installed = spec is not None
    
    results[package] = {
        "installed": is_installed
    }
    
    if is_installed:
        try:
            module = importlib.import_module(package)
            if hasattr(module, "__version__"):
                results[package]["version"] = module.__version__
            else:
                results[package]["version"] = "unknown"
        except Exception as e:
            results[package]["error"] = str(e)

# Check tensor flow specifically
have_gpu = False
if results.get("tensorflow", {}).get("installed", False):
    try:
        import tensorflow as tf
        have_gpu = len(tf.config.list_physical_devices('GPU')) > 0
        results["tensorflow"]["gpu_available"] = have_gpu
    except:
        results["tensorflow"]["gpu_available"] = False

# Report system info
import platform
import os

system_info = {
    "platform": platform.system(),
    "python_version": sys.version,
    "architecture": platform.machine(),
    "processor": platform.processor()
}

# Final result
output = {
    "packages": results,
    "system": system_info
}

print(json.dumps(output))
`;

    // Write the script to a temporary file
    const tempScriptPath = path.join(os.tmpdir(), 'check_python_deps.py');
    fs.writeFileSync(tempScriptPath, checkScript);
    
    // Run the script
    const pythonCheckProcess = spawn(pythonCommand, [tempScriptPath]);
    let outputData = '';
    
    pythonCheckProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    pythonCheckProcess.stderr.on('data', (data) => {
      console.error(`${colors.red}${data.toString()}${colors.reset}`);
    });
    
    pythonCheckProcess.on('error', (err) => {
      console.error(`${colors.red}Failed to run Python dependency check: ${err}${colors.reset}`);
      resolve(false);
    });
    
    pythonCheckProcess.on('exit', (code) => {
      try {
        // Clean up temp file
        fs.unlinkSync(tempScriptPath);
        
        if (code !== 0) {
          console.error(`${colors.red}Python dependency check failed with code: ${code}${colors.reset}`);
          resolve(false);
          return;
        }
        
        // Parse the JSON output
        const results = JSON.parse(outputData);
        
        // Report on the package status
        console.log(`${colors.blue}Python version: ${results.system.python_version.split(' ')[0]}${colors.reset}`);
        console.log(`${colors.blue}Platform: ${results.system.platform} (${results.system.architecture})${colors.reset}`);
        
        const missingPackages = [];
        
        for (const [pkg, info] of Object.entries(results.packages)) {
          if (!info.installed) {
            missingPackages.push(pkg);
            console.error(`${colors.red}Package ${pkg} is not installed${colors.reset}`);
          } else {
            console.log(`${colors.green}Package ${pkg} v${info.version} is installed${colors.reset}`);
            
            // Show GPU info for TensorFlow
            if (pkg === 'tensorflow' && 'gpu_available' in info) {
              if (info.gpu_available) {
                console.log(`${colors.green}TensorFlow has GPU support!${colors.reset}`);
              } else {
                console.log(`${colors.yellow}TensorFlow is running in CPU-only mode${colors.reset}`);
              }
            }
          }
        }
        
        if (missingPackages.length > 0) {
          console.error(`${colors.red}Missing Python packages: ${missingPackages.join(', ')}${colors.reset}`);
          console.log(`${colors.yellow}Installing missing packages...${colors.reset}`);
          installPythonDependencies(pythonCommand).then(resolve);
        } else {
          console.log(`${colors.green}All Python dependencies are installed.${colors.reset}`);
          resolve(true);
        }
        
      } catch (error) {
        console.error(`${colors.red}Error parsing Python dependency check results: ${error}${colors.reset}`);
        resolve(false);
      }
    });
  });
}

// Install Python dependencies
function installPythonDependencies(pythonCommand = 'python3') {
  return new Promise((resolve) => {
    console.log(`${colors.blue}Installing Python dependencies...${colors.reset}`);
    
    // Read requirements from file
    const requirementsPath = path.join(serverDir, 'requirements.txt');
    
    if (!fs.existsSync(requirementsPath)) {
      console.error(`${colors.red}requirements.txt not found.${colors.reset}`);
      resolve(false);
      return;
    }
    
    // Install requirements
    const pipInstall = spawn(pythonCommand, ['-m', 'pip', 'install', '-r', requirementsPath]);
    
    pipInstall.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    pipInstall.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    pipInstall.on('error', (err) => {
      console.error(`${colors.red}Failed to install Python dependencies: ${err}${colors.reset}`);
      resolve(false);
    });
    
    pipInstall.on('exit', (code) => {
      if (code !== 0) {
        console.error(`${colors.red}Python dependencies installation failed with code: ${code}${colors.reset}`);
        resolve(false);
        return;
      }
      
      console.log(`${colors.green}Python dependencies installed successfully.${colors.reset}`);
      resolve(true);
    });
  });
}

// Check if FFmpeg is installed
function checkFFmpeg() {
  return new Promise((resolve) => {
    console.log(`${colors.blue}Checking FFmpeg installation...${colors.reset}`);
    
    const ffmpegProcess = spawn('ffmpeg', ['-version']);
    let versionText = '';
    
    ffmpegProcess.stdout.on('data', (data) => {
      versionText += data.toString();
    });
    
    ffmpegProcess.on('error', () => {
      console.error(`${colors.red}FFmpeg is not installed or not in PATH.${colors.reset}`);
      console.log(`${colors.yellow}Please install FFmpeg and try again.${colors.reset}`);
      resolve(false);
    });
    
    ffmpegProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`${colors.red}FFmpeg check failed.${colors.reset}`);
        resolve(false);
        return;
      }
      
      const version = versionText.split('\n')[0].trim();
      console.log(`${colors.green}FFmpeg is properly installed: ${version}${colors.reset}`);
      resolve(true);
    });
  });
}

// Run all checks
async function runSetup() {
  console.log(`${colors.cyan}Starting Audio Mixer backend setup...${colors.reset}`);
  
  // Display system information
  console.log(`${colors.blue}System information:${colors.reset}`);
  console.log(`- Platform: ${os.platform()} (${os.arch()})`);
  console.log(`- Memory: ${totalMemoryGB.toFixed(1)}GB`);
  console.log(`- CPUs: ${cpuCount}`);
  
  createDirectories();
  
  const nodeResult = checkNodeDependencies();
  if (!nodeResult) {
    console.error(`${colors.red}Node.js dependency check failed.${colors.reset}`);
    return false;
  }
  
  const ffmpegResult = await checkFFmpeg();
  if (!ffmpegResult) {
    console.error(`${colors.red}FFmpeg check failed.${colors.reset}`);
    return false;
  }
  
  const pythonResult = await checkPythonEnvironment();
  if (!pythonResult) {
    console.error(`${colors.red}Python environment check failed.${colors.reset}`);
    console.log(`${colors.yellow}The application will use fallback methods for audio processing.${colors.reset}`);
    // We continue anyway but will use fallbacks
  }
  
  console.log(`${colors.green}Setup completed successfully!${colors.reset}`);
  return true;
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
