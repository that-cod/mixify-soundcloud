
/**
 * Python Bridge Module
 * Provides a bridge between Node.js and Python for running Python scripts
 * and managing the Python environment.
 */

const { checkPythonEnvironment, getPythonPath, hasLibrosa } = require('./python/pythonEnvironment');
const { runScript, runScriptWithProgress } = require('./python/pythonExecutor');
const { pathResolver } = require('./utils/systemUtils');
const fs = require('fs');
const path = require('path');

let environmentChecked = false;
let pythonEnvironmentStatus = null;

/**
 * Run a Python script with proper error handling
 * @param {string} scriptName Name of the Python script (without path)
 * @param {string[]} args Arguments to pass to the script
 * @param {Object} options Additional PythonShell options
 * @returns {Promise<any>} Result from the Python script
 */
async function runPythonScript(scriptName, args = [], options = {}) {
  // Ensure environment is checked
  if (!environmentChecked) {
    await checkPythonEnvironment();
  }
  
  // Before running, verify the script exists
  const scriptPath = path.join(pathResolver.getPythonScriptDir(), scriptName);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Python script not found: ${scriptPath}`);
    throw new Error(`Python script not found: ${scriptName}`);
  }
  
  console.log(`Running Python script: ${scriptName} with args:`, args);
  return runScript(scriptName, args, options, getPythonPath());
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
  if (!environmentChecked) {
    await checkPythonEnvironment();
  }
  
  // Before running, verify the script exists
  const scriptPath = path.join(pathResolver.getPythonScriptDir(), scriptName);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Python script not found: ${scriptPath}`);
    throw new Error(`Python script not found: ${scriptName}`);
  }
  
  console.log(`Running Python script with progress: ${scriptName} with args:`, args);
  return runScriptWithProgress(scriptName, args, onProgress, options, getPythonPath());
}

/**
 * Check if Python environment has been initialized
 * @returns {Promise<boolean>} True if environment has been checked
 */
async function isPythonEnvironmentChecked() {
  if (environmentChecked) {
    return true;
  }
  
  try {
    pythonEnvironmentStatus = await checkPythonEnvironment();
    environmentChecked = true;
    console.log("Python environment status:", {
      pythonPath: pythonEnvironmentStatus.pythonPath ? "Found" : "Not found",
      hasLibrosa: pythonEnvironmentStatus.pythonHasLibrosa
    });
    return environmentChecked;
  } catch (error) {
    console.error("Failed to check Python environment:", error);
    return false;
  }
}

/**
 * Gets the current status of the Python environment
 * @returns {Object|null} Python environment status
 */
function getPythonEnvironmentStatus() {
  return pythonEnvironmentStatus;
}

// Export the public API
module.exports = {
  runPythonScript,
  runPythonScriptWithProgress,
  checkPythonEnvironment,
  isPythonEnvironmentChecked,
  getPythonEnvironmentStatus,
  getPythonScriptDir: pathResolver.getPythonScriptDir
};
