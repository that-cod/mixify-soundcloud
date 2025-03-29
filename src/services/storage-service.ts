
import { supabase } from '@/lib/supabase-client';
import { v4 as uuidv4 } from 'uuid';

// Define the storage bucket name as a constant - case sensitive to match what you've created
export const AUDIO_BUCKET = 'Mixify-audio';

// Interface for bucket status checks
export interface BucketStatus {
  exists: boolean;
  canUpload: boolean;
  isPublic: boolean;
  errorMessage?: string;
}

/**
 * Check if the storage bucket exists and validate access permissions
 */
export async function checkBucketStatus(): Promise<BucketStatus> {
  try {
    console.log(`Checking bucket "${AUDIO_BUCKET}" status...`);
    
    // Step 1: Check if bucket exists by attempting to get its details
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .getBucket(AUDIO_BUCKET);
    
    if (bucketError) {
      console.error('Bucket check error:', bucketError);
      
      // Parse error message to provide more helpful feedback
      if (bucketError.message.includes('does not exist')) {
        return {
          exists: false,
          canUpload: false,
          isPublic: false,
          errorMessage: `Bucket "${AUDIO_BUCKET}" does not exist. Please create it in the Supabase dashboard.`
        };
      }
      
      return {
        exists: false,
        canUpload: false,
        isPublic: false,
        errorMessage: bucketError.message
      };
    }
    
    // Step 2: Check upload permissions by trying to upload a test file
    const testFileName = `permission-test-${Date.now()}.txt`;
    const { error: uploadError } = await supabase
      .storage
      .from(AUDIO_BUCKET)
      .upload(testFileName, new Blob(['test']), {
        upsert: true
      });
    
    // Clean up the test file if upload was successful
    if (!uploadError) {
      await supabase
        .storage
        .from(AUDIO_BUCKET)
        .remove([testFileName]);
    }
    
    // Step 3: Check if bucket is public
    const isPublic = bucketData?.public || false;
    
    return {
      exists: true,
      canUpload: !uploadError,
      isPublic,
      errorMessage: uploadError ? 
        'Upload permission denied. Check your Supabase bucket RLS policies.' : 
        undefined
    };
  } catch (err: any) {
    console.error('Error checking bucket status:', err);
    return {
      exists: false,
      canUpload: false,
      isPublic: false,
      errorMessage: err.message || 'Unknown error checking bucket'
    };
  }
}

/**
 * Upload a file to the Supabase storage bucket
 */
export async function uploadAudioFile(
  file: File,
  trackNumber: number,
  onProgress?: (progress: number) => void
): Promise<{ path: string; publicUrl: string }> {
  try {
    // First check if bucket is accessible
    const bucketStatus = await checkBucketStatus();
    
    // Even if bucket status check fails, we'll try to upload anyway
    // Generate a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `track-${trackNumber}/${fileName}`;
    
    console.log(`Uploading file to ${AUDIO_BUCKET}/${filePath}`, {
      fileName: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type
    });
    
    // Start upload with progress simulation
    if (onProgress) onProgress(10);
    
    // Perform the upload
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    
    // Complete progress
    if (onProgress) onProgress(100);
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase
      .storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(filePath);
    
    console.log('Upload successful:', urlData.publicUrl);
    
    return {
      path: data.path,
      publicUrl: urlData.publicUrl
    };
  } catch (err: any) {
    console.error('Error uploading file:', err);
    throw err;
  }
}
