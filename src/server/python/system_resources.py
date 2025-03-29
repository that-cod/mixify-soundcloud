
#!/usr/bin/env python3
import os
import sys
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
