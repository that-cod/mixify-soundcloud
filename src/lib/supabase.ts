
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

// Improved bucket verification function
export const verifyBucketAccess = async (bucketName: string): Promise<{
  exists: boolean;
  canUpload: boolean;
  isPublic: boolean;
  errorMessage?: string;
}> => {
  try {
    console.log(`Verifying bucket "${bucketName}" access...`);
    
    // Step 1: Check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket(bucketName);
    
    if (bucketError) {
      console.error('Error checking bucket:', bucketError);
      
      if (bucketError.message.includes('does not exist')) {
        return {
          exists: false,
          canUpload: false,
          isPublic: false,
          errorMessage: `Bucket "${bucketName}" does not exist in your Supabase project. Please create it manually in the Supabase dashboard.`
        };
      }
      
      if (bucketError.message.includes('permission') || bucketError.message.includes('not authorized')) {
        return {
          exists: true, // We assume it exists but can't access it
          canUpload: false, 
          isPublic: false,
          errorMessage: 'You do not have permission to access this bucket. Please check your RLS policies.'
        };
      }
      
      return {
        exists: false,
        canUpload: false,
        isPublic: false,
        errorMessage: bucketError.message
      };
    }
    
    console.log(`Bucket verification result:`, bucketData);
    
    // Step 2: Verify upload permissions by trying to create a test file
    const testFileName = `permission-test-${Date.now()}.txt`;
    const { error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(testFileName, new Blob(['test']), {
        upsert: true
      });
      
    // Clean up test file if successfully created
    if (!uploadError) {
      await supabase
        .storage
        .from(bucketName)
        .remove([testFileName]);
    }
    
    // Step 3: Verify if bucket is public by checking the policy
    let isPublic = bucketData?.public || false;
    
    // Additional check: the bucket might be public but configured incorrectly
    if (isPublic) {
      const { data: publicUrl } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(testFileName);
        
      isPublic = !!publicUrl.publicUrl;
    }
    
    return {
      exists: true,
      canUpload: !uploadError,
      isPublic,
      errorMessage: uploadError ? 
        'You do not have permission to upload to this bucket. Please check your RLS policies.' : 
        undefined
    };
  } catch (err: any) {
    console.error('Exception during bucket verification:', err);
    return {
      exists: false,
      canUpload: false,
      isPublic: false,
      errorMessage: err.message || 'Unknown error verifying bucket access'
    };
  }
};

// Check if a bucket exists (simplified version)
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

// No need to create bucket since it's manually created in Supabase dashboard
export const createBucketIfNotExists = async (bucketName: string, isPublic = true) => {
  try {
    console.log(`Ensuring bucket "${bucketName}" exists and is accessible...`);
    
    // First verify bucket access
    const bucketStatus = await verifyBucketAccess(bucketName);
    
    if (!bucketStatus.exists) {
      console.error(`Bucket "${bucketName}" doesn't exist. Please create it manually in the Supabase dashboard.`);
      return false;
    }
    
    if (!bucketStatus.canUpload) {
      console.error(`Cannot upload to bucket "${bucketName}": ${bucketStatus.errorMessage}`);
      return false;
    }
    
    console.log(`Bucket "${bucketName}" is accessible with upload permissions.`);
    return true;
  } catch (err) {
    console.error('Exception during bucket verification:', err);
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
    
    // Verify bucket access before uploading
    const bucketStatus = await verifyBucketAccess(STORAGE_BUCKET);
    
    if (!bucketStatus.exists || !bucketStatus.canUpload) {
      throw new Error(bucketStatus.errorMessage || `Cannot upload: bucket "${STORAGE_BUCKET}" is not accessible`);
    }
    
    // Track upload progress manually if a callback is provided
    let lastProgress = 0;
    
    // Upload file with standard options (no onUploadProgress - it's not supported in FileOptions)
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Replace existing files
      });
    
    // Simulate progress completion since we can't track it directly
    if (progressCallback) {
      progressCallback(100);
      console.log(`Upload progress: 100%`);
    }
    
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
