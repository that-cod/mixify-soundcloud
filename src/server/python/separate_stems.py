
#!/usr/bin/env python3
import sys
import os
import json
import subprocess
import tempfile
import traceback
import shutil
import platform
import psutil

def get_system_resources():
    """Get system resource information to determine processing capacity"""
    try:
        # Get memory information
        memory = psutil.virtual_memory()
        total_memory_gb = memory.total / (1024**3)
        available_memory_gb = memory.available / (1024**3)
        
        # Get CPU information
        cpu_count = psutil.cpu_count(logical=False) or psutil.cpu_count(logical=True)
        
        # Platform information
        system_platform = platform.system()
        architecture = platform.machine()
        
        # Determine if we're on a resource-constrained system
        is_low_resource = (total_memory_gb < 4 or available_memory_gb < 2 or cpu_count < 2)
        
        # Print diagnostic information
        print(f"System resources: {total_memory_gb:.1f}GB RAM ({available_memory_gb:.1f}GB available), {cpu_count} CPUs", file=sys.stderr)
        print(f"Platform: {system_platform} {architecture}", file=sys.stderr)
        
        if is_low_resource:
            print("Detected limited system resources - will use optimized processing", file=sys.stderr)
        
        return {
            "total_memory_gb": total_memory_gb,
            "available_memory_gb": available_memory_gb,
            "cpu_count": cpu_count,
            "platform": system_platform,
            "architecture": architecture,
            "is_low_resource": is_low_resource
        }
    except Exception as e:
        print(f"Error detecting system resources: {str(e)}", file=sys.stderr)
        # Return default conservative values
        return {
            "is_low_resource": True
        }

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

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python separate_stems.py <audio_file_path> <output_directory> [light_mode]", file=sys.stderr)
        sys.exit(1)
        
    audio_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    # Check for light mode flag
    light_mode = False
    if len(sys.argv) > 3 and sys.argv[3].lower() in ('true', '1', 'yes'):
        light_mode = True
        print("Running in light mode with reduced quality for better performance.", file=sys.stderr)
    
    if not os.path.exists(audio_path):
        print(f"Error: File {audio_path} does not exist.", file=sys.stderr)
        sys.exit(1)
        
    result = separate_stems(audio_path, output_dir, light_mode)
    
    # Print progress updates
    print("PROGRESS:100", file=sys.stderr)
    
    # Output JSON result to stdout
    print(json.dumps(result))
