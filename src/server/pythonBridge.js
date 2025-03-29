
/**
 * Python Bridge Module
 * Provides a bridge between Node.js and Python for running Python scripts
 * and managing the Python environment.
 */

const { checkPythonEnvironment, getPythonPath, hasSpleeter, hasLibrosa } = require('./python/pythonEnvironment');
const { runScript, runScriptWithProgress } = require('./python/pythonExecutor');
const { pathResolver } = require('./utils/systemUtils');

/**
 * Run a Python script with proper error handling
 * @param {string} scriptName Name of the Python script (without path)
 * @param {string[]} args Arguments to pass to the script
 * @param {Object} options Additional PythonShell options
 * @returns {Promise<any>} Result from the Python script
 */
async function runPythonScript(scriptName, args = [], options = {}) {
  // Ensure environment is checked
  if (!await isPythonEnvironmentChecked()) {
    await checkPythonEnvironment();
  }
  
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
  if (!await isPythonEnvironmentChecked()) {
    await checkPythonEnvironment();
  }
  
  return runScriptWithProgress(scriptName, args, onProgress, options, getPythonPath());
}

/**
 * Check if Python environment has been initialized
 * @returns {Promise<boolean>} True if environment has been checked
 */
async function isPythonEnvironmentChecked() {
  // Use the exported function to check if the environment has been initialized
  const env = await checkPythonEnvironment();
  return env.pythonPath !== undefined;
}

// Export the public API
module.exports = {
  runPythonScript,
  runPythonScriptWithProgress,
  checkPythonEnvironment,
  getPythonScriptDir: pathResolver.getPythonScriptDir
};
