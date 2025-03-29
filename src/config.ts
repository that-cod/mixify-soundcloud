/**
 * Application Configuration
 * 
 * This file centralizes all environment variables and configuration settings
 * for different deployment environments (development, production, etc.)
 */

// API base URL - default to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Other configuration parameters
export const CONFIG = {
  // API endpoints
  api: {
    baseUrl: API_BASE_URL,
    endpoints: {
      upload: `${API_BASE_URL}/api/upload`,
      analyze: `${API_BASE_URL}/api/analyze`,
      processPrompt: `${API_BASE_URL}/api/process-prompt`,
      mix: `${API_BASE_URL}/api/mix`,
      tracks: `${API_BASE_URL}/api/tracks`,
      status: `${API_BASE_URL}/api/status`,
    }
  },
  
  // Feature flags
  features: {
    useFallbackAnalysis: import.meta.env.VITE_USE_FALLBACK_ANALYSIS === 'true',
    useAudioWorklet: import.meta.env.VITE_USE_AUDIO_WORKLET === 'true',
  },
  
  // Audio processing settings
  audio: {
    maxUploadSizeMB: parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || '20', 10),
    supportedFormats: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg'],
  },
  
  // Frontend settings
  ui: {
    defaultVolumeLevel: 0.8,
    waveformColors: {
      track1: '#4f46e5', // indigo-600
      track2: '#7c3aed', // violet-600
      mixed: '#16a34a', // green-600
    }
  }
};

// For easier imports, also export individual sections
export const API = CONFIG.api;
export const FEATURES = CONFIG.features;
export const AUDIO_SETTINGS = CONFIG.audio;
export const UI_SETTINGS = CONFIG.ui;

export default CONFIG;
