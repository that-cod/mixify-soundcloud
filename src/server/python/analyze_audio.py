
#!/usr/bin/env python3
import sys
import os
import json
import numpy as np
import librosa

def analyze_audio(audio_path):
    """
    Analyze audio file using librosa to extract features
    
    Args:
        audio_path: Path to the audio file
        
    Returns:
        dict: Dictionary containing audio features
    """
    try:
        # Load audio file
        y, sr = librosa.load(audio_path, sr=None)
        
        # Extract features
        # BPM detection
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        # Key detection
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_indices = np.sum(chroma, axis=1)
        key_idx = np.argmax(key_indices)
        
        # Map key index to actual key
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        modes = ['Major', 'Minor']
        
        # Simplified key detection (real systems would be more sophisticated)
        key = keys[key_idx]
        
        # Determine if major or minor
        minor_third = (key_idx + 3) % 12
        major_third = (key_idx + 4) % 12
        
        if key_indices[minor_third] > key_indices[major_third]:
            mode = modes[1]  # Minor
        else:
            mode = modes[0]  # Major
            
        # Energy calculation
        energy = np.mean(librosa.feature.rms(y=y))
        energy_normalized = min(1.0, energy * 10) # Scale to 0-1 range
        
        # Clarity/brightness calculation based on spectral centroid
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        clarity = min(1.0, spectral_centroid / 5000)  # Normalize to 0-1 range
        
        # Extract waveform visualization data (downsampled)
        waveform = []
        step = len(y) // 100  # Get 100 points
        for i in range(0, len(y), step):
            segment = y[i:i+step]
            if len(segment) > 0:
                waveform.append(float(np.abs(segment).mean()))
        
        # Extract frequency spectrum
        spectrum = {}
        # Low, mid, high frequency bands
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
        
        # Return analysis results
        return {
            "bpm": round(float(tempo)),
            "key": f"{key} {mode}",
            "energy": float(energy_normalized),
            "clarity": float(clarity),
            "waveform": waveform,
            "spectrum": spectrum
        }
        
    except Exception as e:
        # In case of failure, return error and default values
        sys.stderr.write(f"Error analyzing audio: {str(e)}\n")
        return {
            "bpm": 120,
            "key": "C Major",
            "energy": 0.5,
            "clarity": 0.5,
            "waveform": [0.5] * 100,
            "spectrum": {"low": 0.33, "mid": 0.33, "high": 0.33}
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python analyze_audio.py <audio_file_path>\n")
        sys.exit(1)
        
    audio_path = sys.argv[1]
    
    if not os.path.exists(audio_path):
        sys.stderr.write(f"Error: File {audio_path} does not exist.\n")
        sys.exit(1)
        
    result = analyze_audio(audio_path)
    
    # Output JSON result to stdout
    print(json.dumps(result))
