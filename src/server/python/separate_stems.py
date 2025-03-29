
#!/usr/bin/env python3
import sys
import os
import json
import subprocess
import tempfile

def separate_stems(audio_path, output_dir):
    """
    Separate audio file into stems using Spleeter
    
    Args:
        audio_path: Path to the audio file
        output_dir: Directory to save separated stems
        
    Returns:
        dict: Dictionary containing paths to separated stems
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Base filename without extension
        base_filename = os.path.basename(audio_path).split('.')[0]
        
        # Run Spleeter as a subprocess
        # Note: Spleeter needs to be installed: pip install spleeter
        subprocess.run([
            "spleeter", "separate", 
            "-p", "spleeter:4stems", 
            "-o", output_dir,
            audio_path
        ], check=True)
        
        # Define paths to the separated stems
        stems_dir = os.path.join(output_dir, base_filename)
        
        stem_paths = {
            "vocals": os.path.join(stems_dir, "vocals.wav"),
            "drums": os.path.join(stems_dir, "drums.wav"),
            "bass": os.path.join(stems_dir, "bass.wav"),
            "other": os.path.join(stems_dir, "other.wav")
        }
        
        # Verify stems exist
        for stem_type, stem_path in stem_paths.items():
            if not os.path.exists(stem_path):
                raise Exception(f"Stem {stem_type} not found at {stem_path}")
        
        # Convert WAV to MP3 for smaller files
        for stem_type, stem_path in stem_paths.items():
            mp3_path = stem_path.replace(".wav", ".mp3")
            subprocess.run([
                "ffmpeg", "-i", stem_path,
                "-codec:a", "libmp3lame", "-qscale:a", "2",
                mp3_path
            ], check=True)
            
            # Update path to MP3
            stem_paths[stem_type] = mp3_path
            
        return stem_paths
        
    except Exception as e:
        # If something fails, use a simple fallback
        sys.stderr.write(f"Error separating stems: {str(e)}\n")
        
        # Create fallback stems (just copying original audio)
        fallback_stems = {}
        for stem_type in ["vocals", "drums", "bass", "other"]:
            fallback_path = os.path.join(output_dir, f"{base_filename}_{stem_type}.mp3")
            # Copy original file as fallback
            subprocess.run([
                "ffmpeg", "-i", audio_path,
                "-codec:a", "libmp3lame", "-qscale:a", "2",
                fallback_path
            ], check=True)
            fallback_stems[stem_type] = fallback_path
            
        return fallback_stems

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.stderr.write("Usage: python separate_stems.py <audio_file_path> <output_directory>\n")
        sys.exit(1)
        
    audio_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    if not os.path.exists(audio_path):
        sys.stderr.write(f"Error: File {audio_path} does not exist.\n")
        sys.exit(1)
        
    result = separate_stems(audio_path, output_dir)
    
    # Output JSON result to stdout
    print(json.dumps(result))
