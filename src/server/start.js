
#!/usr/bin/env node

const path = require('path');
const { spawn } = require('cross-spawn');
const { runSetup } = require('./setup');
const fs = require('fs');

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

// Ensure the uploads directory exists
function ensureUploadsDirectory() {
  const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
  const rootDir = isDev ? path.resolve(__dirname, '..') : process.cwd();
  const uploadsDir = path.join(rootDir, 'uploads');
  const tempDir = path.join(uploadsDir, 'temp');
  
  [uploadsDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`${colors.green}Created directory: ${dir}${colors.reset}`);
    }
  });
}

async function main() {
  console.log(`${colors.cyan}=== AI Audio Mixer Backend ===${colors.reset}`);
  console.log(`${colors.cyan}Running setup checks...${colors.reset}`);
  
  try {
    // Ensure uploads directory exists
    ensureUploadsDirectory();
    
    // Run setup checks
    await runSetup();
    
    // Determine if we're in dev or production mode
    const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
    const script = isDev ? 'dev' : 'start';
    
    console.log(`${colors.green}Starting server in ${isDev ? 'development' : 'production'} mode...${colors.reset}`);
    
    // Start the server
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const server = spawn(npm, ['run', script], {
      stdio: 'inherit',
      cwd: path.join(__dirname)
    });
    
    server.on('error', (err) => {
      console.error(`${colors.red}Failed to start server:${colors.reset}`, err);
      process.exit(1);
    });
    
    server.on('close', (code) => {
      if (code !== 0) {
        console.error(`${colors.red}Server exited with code ${code}${colors.reset}`);
        process.exit(code);
      }
    });
    
    // Handle termination signals
    process.on('SIGINT', () => {
      console.log(`${colors.yellow}Received SIGINT. Gracefully shutting down...${colors.reset}`);
      server.kill('SIGINT');
    });
    
    process.on('SIGTERM', () => {
      console.log(`${colors.yellow}Received SIGTERM. Gracefully shutting down...${colors.reset}`);
      server.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error(`${colors.red}Setup failed:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, err);
  process.exit(1);
});
