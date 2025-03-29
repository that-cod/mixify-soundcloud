
#!/usr/bin/env python3
import sys
import os
import json
import traceback
from stem_separator import separate_stems

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
        
    try:
        result = separate_stems(audio_path, output_dir, light_mode)
        
        # Print progress updates
        print("PROGRESS:100", file=sys.stderr)
        
        # Output JSON result to stdout
        print(json.dumps(result))
    except Exception as e:
        print(f"Fatal error in stem separation: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        sys.exit(1)
