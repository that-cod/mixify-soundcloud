
#!/usr/bin/env python3
import os
import sys
import subprocess
import traceback
from system_resources import get_system_resources
from fallback_separator import create_fallback_stems

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
        
        # Check system resources
        resources = get_system_resources()
        
        # Auto-enable light mode on resource-constrained systems
        if resources.get("is_low_resource", False) and not light_mode:
            print("Auto-enabling light mode due to limited system resources", file=sys.stderr)
            light_mode = True
        
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
                "-y",  # Overwrite output file
                temp_audio_path
            ], check=True, stderr=subprocess.PIPE)
            
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
        
        # Memory optimization for TensorFlow
        mem_limit = None
        if resources.get("total_memory_gb", 0) < 8:
            mem_limit = "2G"
        elif resources.get("total_memory_gb", 0) < 16:
            mem_limit = "4G"
        
        if mem_limit:
            os.environ["TF_FORCE_GPU_ALLOW_GROWTH"] = "true"
            if "TF_MEM_LIMIT" not in os.environ:
                os.environ["TF_MEM_LIMIT"] = mem_limit
        
        # Add the input file path
        spleeter_cmd.append(source_path)
        
        print(f"Running spleeter command: {' '.join(spleeter_cmd)}", file=sys.stderr)
        
        # Run spleeter with timeout for safety
        timeout = 300 if light_mode else 600  # 5 or 10 minutes timeout
        try:
            subprocess.run(spleeter_cmd, check=True, timeout=timeout)
        except subprocess.TimeoutExpired:
            print("Spleeter process timed out, using fallback mode", file=sys.stderr)
            return create_fallback_stems(audio_path, output_dir, base_filename, light_mode)
        
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
                print(f"Stem {stem_type} not found at {stem_path}", file=sys.stderr)
                return create_fallback_stems(audio_path, output_dir, base_filename, light_mode)
        
        # Convert WAV to MP3 for smaller files (if not already in mp3)
        if not light_mode:
            for stem_type, stem_path in stem_paths.items():
                mp3_path = stem_path.replace(".wav", ".mp3")
                
                # Use a lower bitrate for smaller files
                subprocess.run([
                    "ffmpeg", "-i", stem_path,
                    "-codec:a", "libmp3lame", "-qscale:a", "5",
                    "-y", mp3_path
                ], check=True, stderr=subprocess.PIPE)
                
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
        print(error_msg, file=sys.stderr)
        
        # Create fallback stems
        return create_fallback_stems(audio_path, output_dir, base_filename, light_mode)
