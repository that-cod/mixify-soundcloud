
# AI Audio Mixer Backend

This is the backend server for the AI-powered audio mixing application. It handles audio file uploads, analysis, and mixing using various audio processing libraries and AI tools.

## Features

- Audio file upload and storage
- Audio analysis with Meyda and Python tools
- Stem separation using Spleeter
- AI-powered prompt analysis for mixing instructions
- Professional mixing with FFmpeg

## Prerequisites

Before running the server, you need to have the following installed:

- Node.js (v14 or later)
- Python 3.8 or later
- FFmpeg

## Quick Setup

The server includes a setup script that will check for dependencies and install them as needed:

```bash
cd src/server
node setup.js
```

## Manual Installation

1. Clone the repository
2. Install Node.js dependencies:

```bash
cd src/server
npm install
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file with your API keys (a default will be created automatically)

## Running the server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will run on port 5000 by default (or the port specified in your .env file).

## API Endpoints

- `POST /api/upload`: Upload an audio file
- `POST /api/analyze`: Analyze an audio file
- `POST /api/process-prompt`: Process mixing instructions with AI
- `POST /api/mix`: Mix two audio tracks
- `GET /api/tracks/:fileName`: Retrieve a mixed track
- `GET /api/status`: Check server status

## Environment Variables

You can configure the server by setting the following environment variables in the `.env` file:

```
PORT=5000                # Server port
NODE_ENV=development     # Environment (development/production)
CLAUDE_API_KEY=xxx       # Your Claude API key
OPENAI_API_KEY=xxx       # Your OpenAI API key (optional)
MAX_FILE_SIZE_MB=25      # Maximum file size for uploads
UPLOAD_DIR=uploads       # Directory for file uploads
PYTHON_PATH=python3      # Path to Python executable
FRONTEND_URL=http://localhost:3000  # URL of the frontend
```

## Troubleshooting

If you encounter any issues with Python dependencies, especially on different operating systems:

### macOS with Apple Silicon (M1/M2)

For Apple Silicon Macs, use:

```bash
pip install -r requirements.txt
```

The requirements.txt file automatically detects Apple Silicon and installs the appropriate TensorFlow version.

### Windows

On Windows, you may need to install additional dependencies:

```bash
pip install librosa numpy scipy spleeter
```

Make sure FFmpeg is installed and available in your PATH.
