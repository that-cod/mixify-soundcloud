/**
 * Python environment module
 * Handles checking and setting up the Python environment, including dependency installation
 */

const { PythonShell } = require('python-shell');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('cross-spawn');

// Cache Python environment compatibility
let pythonEnvChecked = false;
let pythonPath = process.env.PYTHON_PATH || 'python3';
let pythonHasLibrosa = false;
let pythonHasDemucs = false;

/**
 * Check Python environment and available libraries
 * @returns {Promise<Object>} Environment info
 */
async function checkPythonEnvironment() {
  if (pythonEnvChecked) {
    return {
      pythonPath,
      pythonHasLibrosa,
      pythonHasDemucs,
    };
  }
  
  console.log('Checking Python environment...');
  
  // Try several Python commands to find a working one
  const pythonCommands = ['python3', 'python', process.env.PYTHON_PATH].filter(Boolean);
  
  // Find working Python path
  for (const cmd of pythonCommands) {
    try {
      const result = await new Promise((resolve) => {
        PythonShell.runString(
          'import sys; print(sys.version)', 
          { pythonPath: cmd }, 
          (err, output) => resolve({ err, output })
        );
      });
      
      if (!result.err && result.output && result.output.length > 0) {
        pythonPath = cmd;
        console.log(`Found working Python at: ${cmd}`);
        console.log(`Python version: ${result.output[0]}`);
        break;
      }
    } catch (err) {
      // Continue to next command
    }
  }
  
  // Check and install required Python packages
  await checkAndInstallPythonDependencies();
  
  pythonEnvChecked = true;
  
  return {
    pythonPath,
    pythonHasLibrosa,
    pythonHasDemucs
  };
}

/**
 * Check for and install missing Python packages
 */
async function checkAndInstallPythonDependencies() {
  console.log('Checking Python dependencies...');
  
  // Create a simple script to check required packages
  const checkScript = `
import sys
import importlib.util
import json

required_packages = [
    "librosa", "numpy", "scipy", "demucs", 
    "pydub", "soundfile", "tqdm"
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

print(json.dumps(results))
`;

  // Write the script to a temporary file
  const tempScriptPath = path.join(os.tmpdir(), 'check_python_deps.py');
  fs.writeFileSync(tempScriptPath, checkScript);
  
  try {
    // Run the script
    const results = await new Promise((resolve, reject) => {
      PythonShell.run(tempScriptPath, { pythonPath }, (err, output) => {
        if (err) reject(err);
        else {
          try {
            // Parse the first output as JSON
            const jsonOutput = JSON.parse(output && output.length > 0 ? output[0] : '{}');
            resolve(jsonOutput);
          } catch (e) {
            reject(new Error(`Failed to parse Python dependency check output: ${e.message}`));
          }
        }
      });
    });
    
    // Clean up the temporary file
    fs.unlinkSync(tempScriptPath);
    
    // Process results
    const missingPackages = [];
    
    for (const [pkg, info] of Object.entries(results)) {
      if (!info.installed) {
        missingPackages.push(pkg);
        console.log(`Package ${pkg} is not installed`);
      } else {
        console.log(`Package ${pkg} v${info.version || 'unknown'} is installed`);
        
        // Update global variables for key packages
        if (pkg === 'librosa') pythonHasLibrosa = true;
        if (pkg === 'demucs') pythonHasDemucs = true;
      }
    }
    
    // Install missing packages if any
    if (missingPackages.length > 0) {
      console.log(`Installing missing Python packages: ${missingPackages.join(', ')}`);
      await installPythonDependencies(missingPackages);
      
      // Recheck the critical packages
      await recheckCriticalPackages();
    }
    
  } catch (error) {
    console.error(`Error checking Python dependencies: ${error}`);
    
    // Try to install all dependencies anyway
    await installAllRequiredDependencies();
  }
}

/**
 * Recheck if critical packages are installed after installation
 */
async function recheckCriticalPackages() {
  try {
    // Check for librosa
    const librosaResult = await new Promise((resolve) => {
      PythonShell.runString(
        'try:\n  import librosa\n  print("ok")\nexcept ImportError:\n  print("missing")', 
        { pythonPath }, 
        (err, output) => resolve({ err, output })
      );
    });
    
    pythonHasLibrosa = !librosaResult.err && 
                      librosaResult.output && 
                      librosaResult.output.includes('ok');
    
    console.log(`Librosa available after installation: ${pythonHasLibrosa ? 'Yes' : 'No'}`);
    
    // Check for demucs
    const demucsResult = await new Promise((resolve) => {
      PythonShell.runString(
        'try:\n  import demucs\n  print("ok")\nexcept ImportError:\n  print("missing")', 
        { pythonPath }, 
        (err, output) => resolve({ err, output })
      );
    });
    
    pythonHasDemucs = !demucsResult.err && 
                     demucsResult.output && 
                     demucsResult.output.includes('ok');
    
    console.log(`Demucs available after installation: ${pythonHasDemucs ? 'Yes' : 'No'}`);
  } catch (err) {
    console.error(`Error rechecking Python packages: ${err}`);
  }
}

/**
 * Install specific Python packages
 * @param {string[]} packages - Array of package names to install
 */
async function installPythonDependencies(packages = []) {
  return new Promise((resolve) => {
    console.log(`Installing Python packages: ${packages.join(', ')}`);
    
    // Install packages one by one for better error reporting
    const installPromises = packages.map(pkg => {
      return new Promise((resolvePackage) => {
        console.log(`Installing ${pkg}...`);
        
        // For tensorflow, use platform specific package name
        let packageToInstall = pkg;
        if (pkg === 'tensorflow') {
          const platform = os.platform();
          const arch = os.arch();
          if (platform === 'darwin' && arch === 'arm64') {
            packageToInstall = 'tensorflow-macos';
            // Also install metal plugin for M1/M2 Macs
            installPackage('tensorflow-metal').catch(err => {
              console.warn(`Failed to install tensorflow-metal: ${err.message}`);
            });
          }
        }
        
        installPackage(packageToInstall)
          .then(() => {
            console.log(`Successfully installed ${pkg}`);
            resolvePackage();
          })
          .catch(err => {
            console.error(`Failed to install ${pkg}: ${err.message}`);
            resolvePackage(); // Continue despite errors
          });
      });
    });
    
    Promise.all(installPromises)
      .then(() => {
        console.log('All package installations completed');
        resolve();
      })
      .catch(err => {
        console.error(`Error during package installation: ${err.message}`);
        resolve(); // Continue despite errors
      });
  });
}

/**
 * Install a single Python package
 * @param {string} packageName - Name of the package to install
 */
function installPackage(packageName) {
  return new Promise((resolve, reject) => {
    const pipInstall = spawn(pythonPath, ['-m', 'pip', 'install', packageName]);
    
    pipInstall.stdout.on('data', (data) => {
      console.log(`${data.toString().trim()}`);
    });
    
    pipInstall.stderr.on('data', (data) => {
      console.warn(`${data.toString().trim()}`);
    });
    
    pipInstall.on('error', (err) => {
      reject(new Error(`Failed to install ${packageName}: ${err.message}`));
    });
    
    pipInstall.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Installation exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Install all required dependencies from requirements.txt
 */
async function installAllRequiredDependencies() {
  return new Promise((resolve) => {
    console.log('Installing all required Python dependencies from requirements.txt');
    
    // Read requirements from file
    const requirementsPath = path.join(__dirname, '../requirements.txt');
    
    if (!fs.existsSync(requirementsPath)) {
      console.error('requirements.txt not found.');
      resolve(false);
      return;
    }
    
    // Install requirements
    const pipInstall = spawn(pythonPath, ['-m', 'pip', 'install', '-r', requirementsPath]);
    
    pipInstall.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    
    pipInstall.stderr.on('data', (data) => {
      console.warn(data.toString().trim());
    });
    
    pipInstall.on('error', (err) => {
      console.error(`Failed to install Python dependencies: ${err}`);
      resolve(false);
    });
    
    pipInstall.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Python dependencies installation failed with code: ${code}`);
        resolve(false);
        return;
      }
      
      console.log('Python dependencies installed successfully.');
      
      // Recheck critical packages
      recheckCriticalPackages()
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  });
}

// Export the module
module.exports = {
  checkPythonEnvironment,
  getPythonPath: () => pythonPath,
  hasDemucs: () => pythonHasDemucs,
  hasLibrosa: () => pythonHasLibrosa
};
