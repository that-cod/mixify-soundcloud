
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://grfcpgxwmjpvnliqqyfj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmNwZ3h3bWpwdm5saXFxeWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2ODQzNTIsImV4cCI6MjA1NzI2MDM1Mn0.JIOrKUJSalHaZsUCrS-sBeIrBPKvjWFngXecEjCyoSw';

// Define a constant for our bucket name
export const STORAGE_BUCKET = 'mixify-audio';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  }
});

// Utility function to check if a bucket exists
export const checkBucketExists = async (bucketName: string) => {
  try {
    console.log(`Checking if bucket "${bucketName}" exists...`);
    const { data, error } = await supabase
      .storage
      .getBucket(bucketName);
    
    if (error) {
      console.error('Error checking bucket:', error);
      return false;
    }
    
    console.log(`Bucket check result:`, data);
    return !!data;
  } catch (err) {
    console.error('Exception checking bucket:', err);
    return false;
  }
};

// Improved utility to create a bucket with better error handling
export const createBucketIfNotExists = async (bucketName: string, isPublic = true) => {
  try {
    console.log(`Attempting to ensure bucket "${bucketName}" exists...`);
    
    // First check if the bucket exists
    const exists = await checkBucketExists(bucketName);
    
    if (!exists) {
      console.log(`Bucket "${bucketName}" doesn't exist, creating it now...`);
      
      const { data, error } = await supabase
        .storage
        .createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: 50 * 1024 * 1024 // 50MB limit for audio files
        });
        
      if (error) {
        console.error('Error creating bucket:', error);
        
        // Check if this is a permissions error
        if (error.message.includes('permission') || error.message.includes('not authorized')) {
          console.error('Permission denied. The current user may not have bucket creation rights.');
          return false;
        }
        
        return false;
      }
      
      console.log(`Bucket "${bucketName}" created successfully:`, data);
      
      // Set public bucket policy to ensure files are publicly accessible
      const { error: policyError } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl('test-policy.txt', 60);
      
      if (policyError && !policyError.message.includes('not found')) {
        console.error('Error setting bucket policy:', policyError);
      }
      
      return true;
    }
    
    console.log(`Bucket "${bucketName}" already exists.`);
    return true;
  } catch (err) {
    console.error('Exception during bucket creation process:', err);
    return false;
  }
};

// Function to upload a file to the bucket with detailed logging
export const uploadFileToBucket = async (
  file: File, 
  path: string,
  progressCallback?: (progress: number) => void
) => {
  try {
    console.log(`Starting upload to "${STORAGE_BUCKET}/${path}"`, { 
      fileName: file.name, 
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      fileType: file.type
    });
    
    // Ensure bucket exists before uploading
    const bucketExists = await createBucketIfNotExists(STORAGE_BUCKET, true);
    
    if (!bucketExists) {
      throw new Error(`Cannot upload: bucket "${STORAGE_BUCKET}" doesn't exist and couldn't be created`);
    }
    
    // Upload file with progress tracking
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Replace existing files
        onUploadProgress: progressCallback ? 
          (event) => {
            const progress = (event.loaded / event.total) * 100;
            progressCallback(progress);
            console.log(`Upload progress: ${progress.toFixed(1)}%`);
          } : undefined
      });
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    
    console.log('Upload successful:', data);
    
    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    
    console.log('Public URL:', urlData.publicUrl);
    
    return {
      path: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (err) {
    console.error('Exception during file upload:', err);
    throw err;
  }
};
