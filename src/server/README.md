
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

## Python dependencies

You need to install the following Python packages:

```bash
pip install librosa numpy spleeter
```

## Installation

1. Clone the repository
2. Install Node.js dependencies:

```bash
cd src/server
npm install
```

3. Create a `.env` file with your API keys (use `.env.example` as a template)
4. Create the uploads directory:

```bash
mkdir -p ../uploads
```

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

## Important Notes

- The audio files are stored in the `../uploads` directory
- Large files may take time to process, especially for stem separation
- The server has fallback mechanisms if Spleeter or other advanced features fail
