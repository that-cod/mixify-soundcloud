
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');
const os = require('os');

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
  
  // Check for librosa
  try {
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
    
    console.log(`Librosa available: ${pythonHasLibrosa}`);
  } catch (err) {
    console.error('Error checking for librosa:', err);
  }
  
  // Check for spleeter
  try {
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
    
    console.log(`Spleeter available: ${pythonHasSpleeter}`);
  } catch (err) {
    console.error('Error checking for spleeter:', err);
  }
  
  pythonEnvChecked = true;
  
  return {
    pythonPath,
    pythonHasLibrosa,
    pythonHasSpleeter
  };
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
    const scriptPath = path.join(__dirname, 'python', scriptName);
    
    if (!checkScriptExists(scriptPath)) {
      return reject(new Error(`Python script not found: ${scriptName}`));
    }
    
    // Determine memory constraint for Python
    const totalMemoryMB = Math.floor(os.totalmem() / (1024 * 1024));
    const availableMemoryMB = Math.floor(os.freemem() / (1024 * 1024));
    
    // Set memory limit for Python process if system has limited memory
    let memoryFlag = [];
    if (availableMemoryMB < 1024 || totalMemoryMB < 4096) {
      // Limit Python memory usage on constrained systems
      // This works on Unix-like systems (won't hurt on Windows)
      memoryFlag = ['-Xmx1024m'];
    }
    
    const defaultOptions = {
      mode: 'text',
      pythonPath: pythonPath,
      pythonOptions: ['-u', ...memoryFlag], // unbuffered output + memory limit
      scriptPath: path.join(__dirname, 'python'),
      args: args
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Add timeout for scripts on limited hardware
    if (availableMemoryMB < 1024) {
      mergedOptions.timeout = 180000; // 3 minutes timeout
    }
    
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
    const scriptPath = path.join(__dirname, 'python', scriptName);
    
    if (!checkScriptExists(scriptPath)) {
      return reject(new Error(`Python script not found: ${scriptName}`));
    }
    
    // Determine memory constraint for Python
    const totalMemoryMB = Math.floor(os.totalmem() / (1024 * 1024));
    const availableMemoryMB = Math.floor(os.freemem() / (1024 * 1024));
    
    // Set memory limit for Python process if system has limited memory
    let memoryFlag = [];
    if (availableMemoryMB < 1024 || totalMemoryMB < 4096) {
      // Limit Python memory usage on constrained systems
      memoryFlag = ['-Xmx1024m'];
    }
    
    const defaultOptions = {
      mode: 'text',
      pythonPath: pythonPath,
      pythonOptions: ['-u', ...memoryFlag], // unbuffered output + memory limit 
      scriptPath: path.join(__dirname, 'python'),
      args: args
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Add timeout for scripts on limited hardware
    if (availableMemoryMB < 1024) {
      mergedOptions.timeout = 300000; // 5 minutes timeout
    }
    
    // Create PythonShell instance for interaction
    const pyshell = new PythonShell(scriptName, mergedOptions);
    
    // Collect normal output
    const results = [];
    
    pyshell.on('message', (message) => {
      // Check if it's a progress update
      if (message.startsWith('PROGRESS:') && onProgress) {
        const progressValue = parseFloat(message.replace('PROGRESS:', '').trim());
        onProgress(progressValue);
      } else {
        results.push(message);
      }
    });
    
    pyshell.on('error', (err) => {
      console.error(`Error in Python script ${scriptName}:`, err);
      reject(err);
    });
    
    pyshell.on('close', () => {
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
  checkPythonEnvironment
};
