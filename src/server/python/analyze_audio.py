
#!/usr/bin/env python3
import sys
import os
import json
import numpy as np
import librosa
import traceback

def analyze_audio(audio_path, light_mode=False):
    """
    Analyze audio file using librosa to extract features
    
    Args:
        audio_path: Path to the audio file
        light_mode: If True, uses less memory and CPU at the cost of some accuracy
        
    Returns:
        dict: Dictionary containing audio features
    """
    try:
        # Load audio file with memory optimization if light_mode is enabled
        # sr=22050 is half of CD quality and sufficient for most analysis
        if light_mode:
            # Use lower sample rate and mono for better performance
            y, sr = librosa.load(audio_path, sr=22050, mono=True, res_type='kaiser_fast')
            # Further downsample for very resource-constrained environments
            if len(y) > sr * 60:  # If longer than 1 minute
                hop_length = 2  # Skip every other sample
                y = y[::hop_length]
                sr = sr // hop_length
        else:
            y, sr = librosa.load(audio_path, sr=None)
        
        # Extract features - BPM detection with optimized hop_length
        hop_length = 512 if not light_mode else 1024
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop_length)
        
        # Key detection with optimized size
        chroma_hop_length = 512 if not light_mode else 2048
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=chroma_hop_length)
        key_indices = np.sum(chroma, axis=1)
        key_idx = np.argmax(key_indices)
        
        # Map key index to actual key
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        modes = ['Major', 'Minor']
        
        # Simplified key detection
        key = keys[key_idx]
        
        # Determine if major or minor
        minor_third = (key_idx + 3) % 12
        major_third = (key_idx + 4) % 12
        
        if key_indices[minor_third] > key_indices[major_third]:
            mode = modes[1]  # Minor
        else:
            mode = modes[0]  # Major
            
        # Energy calculation with optional downsampling
        if light_mode and len(y) > sr * 30:  # For files > 30 seconds
            # Take samples at regular intervals
            sample_interval = len(y) // 1000
            y_sampled = y[::sample_interval]
            energy = np.mean(librosa.feature.rms(y=y_sampled))
        else:
            energy = np.mean(librosa.feature.rms(y=y))
            
        energy_normalized = min(1.0, energy * 10) # Scale to 0-1 range
        
        # Clarity/brightness calculation based on spectral centroid
        if light_mode:
            # Use a smaller portion of the audio for spectral centroid
            y_segment = y[:min(len(y), sr * 10)]  # Just use first 10 seconds
            spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y_segment, sr=sr))
        else:
            spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
            
        clarity = min(1.0, spectral_centroid / 5000)  # Normalize to 0-1 range
        
        # Extract waveform visualization data (downsampled)
        waveform = []
        # For light mode, create an even smaller waveform representation
        points = 50 if light_mode else 100
        step = max(1, len(y) // points)
        for i in range(0, len(y), step):
            segment = y[i:i+step]
            if len(segment) > 0:
                waveform.append(float(np.abs(segment).mean()))
        
        # Extract frequency spectrum - optional for light mode
        spectrum = {}
        if not light_mode:
            # Use HPSS for separating harmonic and percussive components
            y_harmonic, y_percussive = librosa.effects.hpss(y)
            
            # Divide spectrum into bands
            spec = np.abs(librosa.stft(y_harmonic))
            low_band = np.mean(spec[:int(spec.shape[0]*0.2), :])
            mid_band = np.mean(spec[int(spec.shape[0]*0.2):int(spec.shape[0]*0.8), :])
            high_band = np.mean(spec[int(spec.shape[0]*0.8):, :])
            
            # Normalize bands
            total = low_band + mid_band + high_band
            if total > 0:
                spectrum['low'] = float(low_band / total)
                spectrum['mid'] = float(mid_band / total)
                spectrum['high'] = float(high_band / total)
            else:
                spectrum['low'] = 0.33
                spectrum['mid'] = 0.33
                spectrum['high'] = 0.33
        else:
            # For light mode, provide approximate values
            spectrum['low'] = 0.33
            spectrum['mid'] = 0.33
            spectrum['high'] = 0.33
        
        # Clear memory explicitly
        del y
        if 'y_harmonic' in locals():
            del y_harmonic
            del y_percussive
        if 'spec' in locals():
            del spec
            
        # Return analysis results
        return {
            "bpm": round(float(tempo)),
            "key": f"{key} {mode}",
            "energy": float(energy_normalized),
            "clarity": float(clarity),
            "waveform": waveform,
            "spectrum": spectrum,
            "light_mode": light_mode
        }
        
    except Exception as e:
        # In case of failure, log detailed error and return default values
        error_msg = f"Error analyzing audio: {str(e)}\n"
        error_msg += traceback.format_exc()
        sys.stderr.write(error_msg)
        
        return {
            "bpm": 120,
            "key": "C Major",
            "energy": 0.5,
            "clarity": 0.5,
            "waveform": [0.5] * (50 if light_mode else 100),
            "spectrum": {"low": 0.33, "mid": 0.33, "high": 0.33},
            "light_mode": light_mode,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python analyze_audio.py <audio_file_path> [light_mode]\n")
        sys.exit(1)
        
    audio_path = sys.argv[1]
    light_mode = False
    
    # Check for light mode flag
    if len(sys.argv) > 2 and sys.argv[2].lower() in ('true', '1', 'yes'):
        light_mode = True
        sys.stderr.write("Running in light mode with reduced memory usage.\n")
    
    if not os.path.exists(audio_path):
        sys.stderr.write(f"Error: File {audio_path} does not exist.\n")
        sys.exit(1)
        
    result = analyze_audio(audio_path, light_mode)
    
    # Output JSON result to stdout
    print(json.dumps(result))
