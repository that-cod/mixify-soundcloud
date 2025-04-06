
#!/usr/bin/env python3
import sys
import json
import importlib.util

def check_library(library_name):
    """Check if a library is installed and importable"""
    try:
        spec = importlib.util.find_spec(library_name)
        if spec is None:
            return False
        lib = importlib.import_module(library_name)
        version = getattr(lib, '__version__', 'unknown')
        return {
            'installed': True,
            'version': version
        }
    except ImportError:
        return False
    except Exception as e:
        return {
            'installed': False,
            'error': str(e)
        }

if __name__ == "__main__":
    # Define libraries to check
    libraries = [
        'numpy',
        'librosa', 
        'scipy',
        'soundfile',
        'pydub',
        'demucs',
        'tqdm'
    ]
    
    # Check each library
    results = {}
    for lib in libraries:
        results[lib] = check_library(lib)
    
    # Print results as JSON
    print(json.dumps(results))
    
    # Report summary to stderr
    missing = [lib for lib, status in results.items() if status is False or (isinstance(status, dict) and not status.get('installed'))]
    if missing:
        sys.stderr.write(f"Missing libraries: {', '.join(missing)}\n")
    else:
        sys.stderr.write("All required libraries are installed.\n")

    # Exit with error code if critical libraries are missing
    critical = ['numpy', 'librosa', 'soundfile']
    critical_missing = [lib for lib in critical if lib in missing]
    if critical_missing:
        sys.exit(1)
