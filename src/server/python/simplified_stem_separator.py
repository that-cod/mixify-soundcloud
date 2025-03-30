
#!/usr/bin/env python3
import os
import sys
import json
import traceback
import subprocess
import numpy as np
from pathlib import Path

def separate_stems_lightweight(audio_path, output_dir, light_mode=False):
    """
    Separate audio file into stems using FFmpeg directly for faster processing
    with fewer dependencies
    
    Args:
        audio_path: Path to the audio file
        output_dir: Directory to save separated stems
        light_mode: If True, uses faster but lower quality separation
        
    Returns:
        dict: Dictionary containing paths to separated stems
    """
    try:
        print(f"Starting lightweight stem separation for {audio_path}", file=sys.stderr)
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Base filename without extension
        base_filename = os.path.basename(audio_path).split('.')[0]
        stems_dir = os.path.join(output_dir, base_filename)
        os.makedirs(stems_dir, exist_ok=True)
        
        # File extension based on mode
        file_ext = "mp3" if light_mode else "wav"
        bitrate = "96k" if light_mode else "256k"
        
        # Separate using frequency-based filtering with FFmpeg
        # This is a simplified approach that doesn't require machine learning libraries
        
        # Create stems paths
        stem_paths = {
            "vocals": os.path.join(stems_dir, f"vocals.{file_ext}"),
            "drums": os.path.join(stems_dir, f"drums.{file_ext}"),
            "bass": os.path.join(stems_dir, f"bass.{file_ext}"),
            "other": os.path.join(stems_dir, f"other.{file_ext}")
        }
        
        # Create simplified stems with FFmpeg frequency filtering
        # Vocals: midrange frequencies (200Hz-5kHz)
        subprocess.run([
            "ffmpeg", "-i", audio_path,
            "-af", "bandpass=f=2000:width_type=h:width=4800,acompressor=threshold=-20dB:ratio=4:attack=20:release=100",
            "-b:a", bitrate, "-y", stem_paths["vocals"]
        ], check=True, stderr=subprocess.PIPE)
        print("PROGRESS:25", file=sys.stderr)
        
        # Drums: higher frequencies with fast transients
        subprocess.run([
            "ffmpeg", "-i", audio_path,
            "-af", "highpass=f=200,lowpass=f=8000,acompressor=threshold=-15dB:ratio=5:attack=5:release=50",
            "-b:a", bitrate, "-y", stem_paths["drums"]
        ], check=True, stderr=subprocess.PIPE)
        print("PROGRESS:50", file=sys.stderr)
        
        # Bass: low frequencies (below 250Hz)
        subprocess.run([
            "ffmpeg", "-i", audio_path,
            "-af", "lowpass=f=250,acompressor=threshold=-10dB:ratio=6:attack=10:release=80",
            "-b:a", bitrate, "-y", stem_paths["bass"]
        ], check=True, stderr=subprocess.PIPE)
        print("PROGRESS:75", file=sys.stderr)
        
        # Other: remaining frequencies
        subprocess.run([
            "ffmpeg", "-i", audio_path,
            "-af", "bandreject=f=2000:width_type=h:width=4800,bandreject=f=100:width_type=h:width=300",
            "-b:a", bitrate, "-y", stem_paths["other"]
        ], check=True, stderr=subprocess.PIPE)
        print("PROGRESS:100", file=sys.stderr)
        
        return stem_paths
        
    except Exception as e:
        error_msg = f"Error in lightweight stem separation: {str(e)}\n"
        error_msg += traceback.format_exc()
        print(error_msg, file=sys.stderr)
        
        # Create fallback stems (just copy the original audio to all stems)
        try:
            stem_paths = {}
            for stem_type in ["vocals", "drums", "bass", "other"]:
                output_path = os.path.join(output_dir, base_filename, f"{stem_type}.mp3")
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                # Create a simplified version with volume adjustments
                if stem_type == "vocals":
                    # For vocals, use bandpass filter
                    subprocess.run([
                        "ffmpeg", "-i", audio_path,
                        "-af", "bandpass=f=2000:width_type=h:width=3000,volume=0.8",
                        "-b:a", "128k", "-y", output_path
                    ], check=True, stderr=subprocess.PIPE)
                elif stem_type == "bass":
                    # For bass, use lowpass filter
                    subprocess.run([
                        "ffmpeg", "-i", audio_path,
                        "-af", "lowpass=f=200,volume=0.6",
                        "-b:a", "128k", "-y", output_path
                    ], check=True, stderr=subprocess.PIPE)
                elif stem_type == "drums":
                    # For drums, use bandpass filter
                    subprocess.run([
                        "ffmpeg", "-i", audio_path,
                        "-af", "bandpass=f=1000:width_type=h:width=2000,volume=0.5",
                        "-b:a", "128k", "-y", output_path
                    ], check=True, stderr=subprocess.PIPE)
                else:
                    # For other, just reduce volume
                    subprocess.run([
                        "ffmpeg", "-i", audio_path,
                        "-af", "volume=0.4",
                        "-b:a", "128k", "-y", output_path
                    ], check=True, stderr=subprocess.PIPE)
                
                stem_paths[stem_type] = output_path
            
            return stem_paths
        except Exception as fallback_error:
            print(f"Fallback stem creation also failed: {str(fallback_error)}", file=sys.stderr)
            raise
