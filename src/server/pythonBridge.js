
const path = require('path');
const { PythonShell } = require('python-shell');
const fs = require('fs');

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
 * @returns {Promise<any>} Result from the Python script
 */
function runPythonScript(scriptName, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'python', scriptName);
    
    if (!checkScriptExists(scriptPath)) {
      return reject(new Error(`Python script not found: ${scriptName}`));
    }
    
    const defaultOptions = {
      mode: 'text',
      pythonPath: process.env.PYTHON_PATH || 'python3',
      pythonOptions: ['-u'], // unbuffered output
      scriptPath: path.join(__dirname, 'python'),
      args: args
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
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
function runPythonScriptWithProgress(scriptName, args = [], onProgress = null, options = {}) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'python', scriptName);
    
    if (!checkScriptExists(scriptPath)) {
      return reject(new Error(`Python script not found: ${scriptName}`));
    }
    
    const defaultOptions = {
      mode: 'text',
      pythonPath: process.env.PYTHON_PATH || 'python3',
      pythonOptions: ['-u'], // unbuffered output
      scriptPath: path.join(__dirname, 'python'),
      args: args
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
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
  runPythonScriptWithProgress
};
