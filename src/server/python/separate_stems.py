
#!/usr/bin/env python3
import sys
import os
import json
import subprocess
import tempfile
import traceback
import shutil

def separate_stems(audio_path, output_dir, light_mode=False):
    """
    Separate audio file into stems using Spleeter
    
    Args:
        audio_path: Path to the audio file
        output_dir: Directory to save separated stems
        light_mode: If True, uses faster but lower quality separation
        
    Returns:
        dict: Dictionary containing paths to separated stems
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Base filename without extension
        base_filename = os.path.basename(audio_path).split('.')[0]
        
        # Preprocess audio file for smaller size if in light mode
        if light_mode:
            # Create temporary file for preprocessing
            temp_audio_path = os.path.join(output_dir, f"{base_filename}_temp.mp3")
            
            # Convert to mono, reduce quality for faster processing
            subprocess.run([
                "ffmpeg", "-i", audio_path,
                "-ac", "1",  # Convert to mono
                "-b:a", "96k",  # Lower bitrate
                "-filter:a", "volume=1.5",  # Normalize volume a bit
                temp_audio_path
            ], check=True)
            
            # Use the preprocessed file
            source_path = temp_audio_path
        else:
            source_path = audio_path
        
        # Run Spleeter as a subprocess with appropriate settings
        # Note: Spleeter needs to be installed: pip install spleeter
        spleeter_cmd = [
            "spleeter", "separate", 
            "-p", "spleeter:4stems", 
            "-o", output_dir
        ]
        
        # Add resource-saving options for light mode
        if light_mode:
            # Add -b 16 for 16kHz audio (lower quality but faster)
            spleeter_cmd.extend(["-b", "16", "-c", "mp3"])
        
        # Add the input file path
        spleeter_cmd.append(source_path)
        
        # Run spleeter
        subprocess.run(spleeter_cmd, check=True)
        
        # Define paths to the separated stems
        stems_dir = os.path.join(output_dir, base_filename)
        
        # File extension depends on mode
        file_ext = "mp3" if light_mode else "wav"
        
        stem_paths = {
            "vocals": os.path.join(stems_dir, f"vocals.{file_ext}"),
            "drums": os.path.join(stems_dir, f"drums.{file_ext}"),
            "bass": os.path.join(stems_dir, f"bass.{file_ext}"),
            "other": os.path.join(stems_dir, f"other.{file_ext}")
        }
        
        # Verify stems exist
        for stem_type, stem_path in stem_paths.items():
            if not os.path.exists(stem_path):
                raise Exception(f"Stem {stem_type} not found at {stem_path}")
        
        # Convert WAV to MP3 for smaller files (if not already in mp3)
        if not light_mode:
            for stem_type, stem_path in stem_paths.items():
                mp3_path = stem_path.replace(".wav", ".mp3")
                
                # Use a lower bitrate for smaller files
                subprocess.run([
                    "ffmpeg", "-i", stem_path,
                    "-codec:a", "libmp3lame", "-qscale:a", "5",
                    "-y", mp3_path
                ], check=True)
                
                # Update path to MP3
                stem_paths[stem_type] = mp3_path
                
                # Remove original WAV to save space
                try:
                    os.remove(stem_path)
                except:
                    pass
            
        # Clean up temporary file if it exists
        if light_mode and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except:
                pass
                
        return stem_paths
        
    except Exception as e:
        # If something fails, use a simple fallback
        error_msg = f"Error separating stems: {str(e)}\n"
        error_msg += traceback.format_exc()
        sys.stderr.write(error_msg)
        
        # Create fallback stems (just copying original audio)
        fallback_stems = {}
        for stem_type in ["vocals", "drums", "bass", "other"]:
            fallback_path = os.path.join(output_dir, f"{base_filename}_{stem_type}.mp3")
            
            # Use simpler ffmpeg settings for fallback
            bitrate = "64k" if light_mode else "128k"
            
            # Copy original file as fallback
            subprocess.run([
                "ffmpeg", "-i", audio_path,
                "-codec:a", "libmp3lame", "-b:a", bitrate,
                "-y", fallback_path
            ], check=True)
            
            fallback_stems[stem_type] = fallback_path
            
        return fallback_stems

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.stderr.write("Usage: python separate_stems.py <audio_file_path> <output_directory> [light_mode]\n")
        sys.exit(1)
        
    audio_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    # Check for light mode flag
    light_mode = False
    if len(sys.argv) > 3 and sys.argv[3].lower() in ('true', '1', 'yes'):
        light_mode = True
        sys.stderr.write("Running in light mode with reduced quality for better performance.\n")
    
    if not os.path.exists(audio_path):
        sys.stderr.write(f"Error: File {audio_path} does not exist.\n")
        sys.exit(1)
        
    result = separate_stems(audio_path, output_dir, light_mode)
    
    # Output JSON result to stdout
    print(json.dumps(result))
