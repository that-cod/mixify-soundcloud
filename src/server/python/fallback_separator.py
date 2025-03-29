
#!/usr/bin/env python3
import os
import sys
import subprocess

def create_fallback_stems(audio_path, output_dir, base_filename, light_mode):
    """Create fallback stems when spleeter fails"""
    print("Using fallback stem separation method", file=sys.stderr)
    
    fallback_stems = {}
    stem_types = ["vocals", "drums", "bass", "other"]
    
    # Create a directory for the stems if it doesn't exist
    stems_dir = os.path.join(output_dir, base_filename)
    os.makedirs(stems_dir, exist_ok=True)
    
    for stem_type in stem_types:
        fallback_path = os.path.join(stems_dir, f"{stem_type}.mp3")
        
        # Use simpler ffmpeg settings for fallback
        bitrate = "64k" if light_mode else "128k"
        
        try:
            # Copy original file as fallback
            subprocess.run([
                "ffmpeg", "-i", audio_path,
                "-codec:a", "libmp3lame", "-b:a", bitrate,
                "-y", fallback_path
            ], check=True, stderr=subprocess.PIPE)
            
            fallback_stems[stem_type] = fallback_path
        except Exception as e:
            print(f"Error creating fallback stem for {stem_type}: {str(e)}", file=sys.stderr)
            # If even this fails, just point to the original file
            fallback_stems[stem_type] = audio_path
            
    return fallback_stems
