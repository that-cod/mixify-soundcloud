
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processAudio, analyzeAudio } = require('./audioProcessor');
const { mixTracks } = require('./mixingEngine');
const { analyzePrompt } = require('./promptAnalyzer');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  }
});

// Routes
// Upload tracks endpoint
app.post('/api/upload', upload.single('track'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    
    res.status(200).json({
      message: 'File uploaded successfully',
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileId: path.basename(req.file.path)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed', details: error.message });
  }
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
    const outputPath = path.join(__dirname, '../uploads', outputFileName);
    
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
  const filePath = path.join(__dirname, '../uploads', fileName);
  
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(filePath);
  });
});

// Handle errors
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Audio mixing server running on port ${PORT}`);
});

module.exports = app;
