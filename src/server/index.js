const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processAudio, analyzeAudio } = require('./audio');
const { mixTracks } = require('./mixing');
const { analyzePrompt } = require('./promptAnalyzer');
const config = require('./config');
const { runSetup } = require('./setup');

// Run setup check before starting the server
(async function() {
  try {
    await runSetup();
    startServer();
  } catch (error) {
    console.error('Server setup failed:', error);
    process.exit(1);
  }
})();

// Create Express app
function startServer() {
  const app = express();
  const PORT = config.server.port;

  // Middleware
  // Enable CORS with more permissive options for development
  const corsOptions = {
    origin: function(origin, callback) {
      // Allow any origin in development mode
      if (config.server.env === 'development' || !origin) {
        return callback(null, true);
      }
      
      // In production, check against allowed origins
      const allowedOrigins = [config.frontend.url, /\.lovable(project)?\.com$/];
      const allowed = allowedOrigins.some(allowedOrigin => {
        return typeof allowedOrigin === 'string' 
          ? allowedOrigin === origin
          : allowedOrigin.test(origin);
      });
      
      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
  
  app.use(cors(corsOptions));
  app.use(express.json());

  // Ensure upload directory exists
  if (!fs.existsSync(config.fileStorage.uploadDir)) {
    console.log(`Creating upload directory: ${config.fileStorage.uploadDir}`);
    fs.mkdirSync(config.fileStorage.uploadDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.fileStorage.uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  const upload = multer({ 
    storage,
    limits: { fileSize: config.fileStorage.maxFileSizeMB * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed!'), false);
      }
    }
  });

  // Simple server status check endpoint (responds to HEAD requests)
  app.head('/api/status', (req, res) => {
    res.status(200).end();
  });

  // Routes
  // Upload tracks endpoint
  app.post('/api/upload', (req, res) => {
    console.log('Received upload request');
    
    // Use single file upload middleware with error handling
    upload.single('track')(req, res, (err) => {
      if (err) {
        console.error('Upload middleware error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ 
            error: 'File too large',
            details: `Maximum file size is ${config.fileStorage.maxFileSizeMB}MB`
          });
        }
        return res.status(400).json({ 
          error: err.message || 'Upload failed',
          details: 'Check file type and size'
        });
      }
      
      // Check if file was uploaded
      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ 
          error: 'No audio file uploaded',
          details: 'Make sure to include a file with key "track"'
        });
      }
      
      console.log('File uploaded successfully:', {
        path: req.file.path,
        filename: req.file.originalname,
        size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`
      });
      
      // Return success response with full URL
      const baseUrl = req.protocol + '://' + req.get('host');
      const fileUrl = `/api/tracks/${path.basename(req.file.path)}`;
      
      res.status(200).json({
        message: 'File uploaded successfully',
        filePath: fileUrl,
        fileName: req.file.originalname,
        fileId: path.basename(req.file.path),
        fullUrl: baseUrl + fileUrl
      });
    });
  });

  // Analyze track endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const { filePath, trackNumber } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      const analysisResults = await analyzeAudio(filePath);
      
      res.status(200).json({
        message: 'Analysis complete',
        trackNumber,
        features: analysisResults
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
  });

  // Process prompt endpoint
  app.post('/api/process-prompt', async (req, res) => {
    try {
      const { prompt, track1Features, track2Features } = req.body;
      
      if (!prompt || !track1Features || !track2Features) {
        return res.status(400).json({ 
          error: 'Missing required data', 
          details: 'Prompt and track features are required' 
        });
      }
      
      const analysisResult = await analyzePrompt(prompt, track1Features, track2Features);
      
      res.status(200).json({
        message: 'Prompt analysis complete',
        analysis: analysisResult
      });
    } catch (error) {
      console.error('Prompt processing error:', error);
      res.status(500).json({ error: 'Prompt processing failed', details: error.message });
    }
  });

  // Mix tracks endpoint
  app.post('/api/mix', async (req, res) => {
    try {
      const { 
        track1Path, 
        track2Path, 
        settings,
        outputFileName = 'mixed-track.mp3'
      } = req.body;
      
      if (!track1Path || !track2Path) {
        return res.status(400).json({ error: 'Both track paths are required' });
      }
      
      // Process mixing asynchronously
      const outputPath = path.join(config.fileStorage.uploadDir, outputFileName);
      
      // Start mixing process
      const mixingResult = await mixTracks(
        track1Path, 
        track2Path, 
        settings, 
        outputPath
      );
      
      res.status(200).json({
        message: 'Mixing complete',
        mixedTrackPath: `/api/tracks/${outputFileName}`,
        mixingDetails: mixingResult
      });
    } catch (error) {
      console.error('Mixing error:', error);
      res.status(500).json({ error: 'Mixing failed', details: error.message });
    }
  });

  // Serve mixed tracks
  app.get('/api/tracks/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(config.fileStorage.uploadDir, fileName);
    
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: 'File not found' });
      }
      res.sendFile(filePath);
    });
  });

  // Server status endpoint with more details
  app.get('/api/status', (req, res) => {
    res.status(200).json({
      status: 'running',
      version: '1.0.0',
      environment: config.server.env,
      uptime: process.uptime(),
      system: {
        memory: config.server.systemInfo,
        isLowResourceSystem: config.server.isLowResourceSystem
      }
    });
  });

  // CORS pre-flight route for all API endpoints
  app.options('*', cors(corsOptions));

  // Handle CORS errors
  app.use((err, req, res, next) => {
    if (err.message.includes('CORS')) {
      console.error('CORS error:', {
        origin: req.headers.origin,
        method: req.method,
        path: req.path
      });
      return res.status(403).json({
        error: 'CORS error',
        message: 'Cross-Origin Request Blocked',
        details: 'This server only accepts requests from allowed origins'
      });
    }
    next(err);
  });

  // Error handler middleware - add detailed error responses
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    // Return appropriate status code based on error type
    const statusCode = err.statusCode || 500;
    
    // Format error message for client
    res.status(statusCode).json({
      error: 'Request failed',
      message: err.message || 'Something went wrong!',
      details: config.server.env === 'development' ? err.stack : 'Internal server error'
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Audio mixing server running on port ${PORT}`);
    console.log(`Environment: ${config.server.env}`);
    console.log(`Upload directory: ${config.fileStorage.uploadDir}`);
  });

  return app;
}

// Export the app for testing
module.exports = { startServer };
