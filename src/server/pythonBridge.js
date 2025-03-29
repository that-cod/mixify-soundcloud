const { PythonShell } = require('python-shell');
const fs = require('fs');
const os = require('os');
const config = require('./config');
const { spawn } = require('cross-spawn');
const { pathResolver, getSystemResources, calculateMemoryLimits } = require('./utils/systemUtils');

// Cache for checking if Python scripts exist
const scriptExistsCache = {};

// Cache Python environment compatibility
let pythonEnvChecked = false;
let pythonPath = process.env.PYTHON_PATH || 'python3';
let pythonHasLibrosa = false;
let pythonHasSpleeter = false;

/**
 * Check Python environment and available libraries
 * @returns {Promise<Object>} Environment info
 */
async function checkPythonEnvironment() {
  if (pythonEnvChecked) {
    return {
      pythonPath,
      pythonHasLibrosa,
      pythonHasSpleeter,
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
    pythonHasSpleeter
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

print(json.dumps(results))
`;

  // Write the script to a temporary file
  const tempScriptPath = require('path').join(os.tmpdir(), 'check_python_deps.py');
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
        if (pkg === 'spleeter') pythonHasSpleeter = true;
        
        // Show GPU info for TensorFlow
        if (pkg === 'tensorflow' && 'gpu_available' in info) {
          if (info.gpu_available) {
            console.log(`TensorFlow has GPU support!`);
          } else {
            console.log(`TensorFlow is running in CPU-only mode`);
          }
        }
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
    
    // Check for spleeter
    const spleeterResult = await new Promise((resolve) => {
      PythonShell.runString(
        'try:\n  import spleeter\n  print("ok")\nexcept ImportError:\n  print("missing")', 
        { pythonPath }, 
        (err, output) => resolve({ err, output })
      );
    });
    
    pythonHasSpleeter = !spleeterResult.err && 
                        spleeterResult.output && 
                        spleeterResult.output.includes('ok');
    
    console.log(`Spleeter available after installation: ${pythonHasSpleeter ? 'Yes' : 'No'}`);
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
    const requirementsPath = path.join(__dirname, 'requirements.txt');
    
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

/**
 * Check if a Python script exists
 * @param {string} scriptPath Path to the Python script
 * @returns {boolean} True if script exists
 */
function checkScriptExists(scriptPath) {
  if (scriptExistsCache[scriptPath] !== undefined) {
    return scriptExistsCache[scriptPath];
  }
  
  const exists = fs.existsSync(scriptPath);
  scriptExistsCache[scriptPath] = exists;
  
  if (!exists) {
    console.error(`Python script not found: ${scriptPath}`);
  }
  
  return exists;
}

/**
 * Run a Python script with proper error handling
 * @param {string} scriptName Name of the Python script (without path)
 * @param {string[]} args Arguments to pass to the script
 * @param {Object} options Additional PythonShell options
 * @returns {Promise<any>} Result from the Python script
 */
async function runPythonScript(scriptName, args = [], options = {}) {
  // Ensure environment is checked
  if (!pythonEnvChecked) {
    await checkPythonEnvironment();
  }
  
  return new Promise((resolve, reject) => {
    // Use standardized path resolution
    const scriptPath = pathResolver.resolvePythonScript(scriptName);
    
    if (!checkScriptExists(scriptPath)) {
      return reject(new Error(`Python script not found: ${scriptName} (looked in ${pathResolver.getPythonScriptDir()})`));
    }
    
    // Get system resources and memory limits
    const resources = getSystemResources();
    const memoryLimits = calculateMemoryLimits();
    
    // Set memory limit for Python process
    let memoryFlag = [];
    if (resources.isLowResourceSystem) {
      memoryFlag = [`-Xmx${memoryLimits.heapLimitMB}m`];
    }
    
    // Set up environment variables for Python
    const env = { ...process.env };
    
    // Pass system resources info to Python
    env.SYSTEM_MEMORY_MB = String(resources.totalMemoryGB * 1024);
    env.AVAILABLE_MEMORY_MB = String(resources.availableMemoryGB * 1024);
    env.CPU_COUNT = String(resources.cpuCount);
    
    const defaultOptions = {
      mode: 'text',
      pythonPath: pythonPath,
      pythonOptions: ['-u', ...memoryFlag], // unbuffered output + memory limit
      scriptPath: pathResolver.getPythonScriptDir(),
      args: args,
      env: env
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Add timeout for scripts on limited hardware
    if (resources.isLowResourceSystem) {
      mergedOptions.timeout = 300000; // 5 minutes timeout for low-resource systems
    }
    
    console.log(`Running Python script: ${scriptName} with args: ${args.join(' ')}`);
    
    PythonShell.run(scriptName, mergedOptions, (err, results) => {
      if (err) {
        console.error(`Error running Python script ${scriptName}:`, err);
        return reject(err);
      }
      
      try {
        // Check if the result is JSON
        if (results && results.length > 0) {
          try {
            const jsonResult = JSON.parse(results[0]);
            return resolve(jsonResult);
          } catch (parseError) {
            // Not JSON, return the raw results
            return resolve(results);
          }
        }
        
        return resolve(results);
      } catch (parseError) {
        console.error(`Error parsing Python script output:`, parseError);
        reject(parseError);
      }
    });
  });
}

/**
 * Run a long-running Python script with progress updates
 * @param {string} scriptName Name of the Python script
 * @param {string[]} args Arguments to pass to the script
 * @param {Function} onProgress Callback for progress updates
 * @param {Object} options Additional PythonShell options
 * @returns {Promise<any>} Final result from the Python script
 */
async function runPythonScriptWithProgress(scriptName, args = [], onProgress = null, options = {}) {
  // Ensure environment is checked
  if (!pythonEnvChecked) {
    await checkPythonEnvironment();
  }
  
  return new Promise((resolve, reject) => {
    // Use standardized path resolution
    const scriptPath = pathResolver.resolvePythonScript(scriptName);
    
    if (!checkScriptExists(scriptPath)) {
      return reject(new Error(`Python script not found: ${scriptName} (looked in ${pathResolver.getPythonScriptDir()})`));
    }
    
    // Get system resources and memory limits
    const resources = getSystemResources();
    const memoryLimits = calculateMemoryLimits();
    
    // Set memory limit for Python process
    let memoryFlag = [];
    if (resources.isLowResourceSystem) {
      memoryFlag = [`-Xmx${memoryLimits.heapLimitMB}m`];
    }
    
    // Set up environment variables for Python
    const env = { ...process.env };
    
    // Pass system resources info to Python
    env.SYSTEM_MEMORY_MB = String(resources.totalMemoryGB * 1024);
    env.AVAILABLE_MEMORY_MB = String(resources.availableMemoryGB * 1024);
    env.CPU_COUNT = String(resources.cpuCount);
    
    const defaultOptions = {
      mode: 'text',
      pythonPath: pythonPath,
      pythonOptions: ['-u', ...memoryFlag], // unbuffered output + memory limit 
      scriptPath: pathResolver.getPythonScriptDir(),
      args: args,
      env: env
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Add timeout for scripts on limited hardware
    if (resources.isLowResourceSystem) {
      mergedOptions.timeout = 600000; // 10 minutes timeout for long-running tasks
    }
    
    console.log(`Running Python script with progress: ${scriptName} with args: ${args.join(' ')}`);
    
    // Create PythonShell instance for interaction
    const pyshell = new PythonShell(scriptName, mergedOptions);
    
    // Collect normal output
    const results = [];
    
    pyshell.on('message', (message) => {
      // Check if it's a progress update
      if (message.startsWith('PROGRESS:') && onProgress) {
        try {
          const progressValue = parseFloat(message.replace('PROGRESS:', '').trim());
          onProgress(progressValue);
        } catch (e) {
          console.warn('Invalid progress format:', message);
        }
      } else {
        results.push(message);
      }
    });
    
    pyshell.on('stderr', (err) => {
      // Log stderr output but don't fail the process
      console.warn(`[Python ${scriptName}]:`, err);
    });
    
    pyshell.on('error', (err) => {
      console.error(`Error in Python script ${scriptName}:`, err);
      reject(err);
    });
    
    pyshell.on('close', (exitCode) => {
      if (exitCode !== 0 && exitCode !== null) {
        console.warn(`Python script ${scriptName} exited with code: ${exitCode}`);
      }
      
      try {
        // Try to parse the last result as JSON
        if (results.length > 0) {
          try {
            const jsonResult = JSON.parse(results[results.length - 1]);
            resolve(jsonResult);
          } catch (e) {
            // Not JSON, return all results
            resolve(results);
          }
        } else {
          resolve(null);
        }
      } catch (parseError) {
        console.error(`Error parsing Python script output:`, parseError);
        reject(parseError);
      }
    });
  });
}

module.exports = {
  runPythonScript,
  runPythonScriptWithProgress,
  checkPythonEnvironment,
  getPythonScriptDir: pathResolver.getPythonScriptDir
};
