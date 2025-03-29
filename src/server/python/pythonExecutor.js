
/**
 * Python script execution module
 * Handles the core functionality of running Python scripts with proper error handling
 */

const { PythonShell } = require('python-shell');
const fs = require('fs');
const { pathResolver, getSystemResources, calculateMemoryLimits } = require('../utils/systemUtils');

// Cache for checking if Python scripts exist
const scriptExistsCache = {};

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
 * @param {string} pythonPath Path to Python executable
 * @returns {Promise<any>} Result from the Python script
 */
async function runScript(scriptName, args = [], options = {}, pythonPath = 'python3') {
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
 * @param {string} pythonPath Path to Python executable
 * @returns {Promise<any>} Final result from the Python script
 */
async function runScriptWithProgress(scriptName, args = [], onProgress = null, options = {}, pythonPath = 'python3') {
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
  runScript,
  runScriptWithProgress,
  checkScriptExists
};
