
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

// Utility to create a bucket if it doesn't exist
export const createBucketIfNotExists = async (bucketName: string, isPublic = true) => {
  try {
    const exists = await checkBucketExists(bucketName);
    
    if (!exists) {
      console.log(`Bucket "${bucketName}" doesn't exist, attempting to create...`);
      const { data, error } = await supabase
        .storage
        .createBucket(bucketName, {
          public: isPublic
        });
        
      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }
      
      console.log(`Bucket "${bucketName}" created successfully:`, data);
      return true;
    }
    
    console.log(`Bucket "${bucketName}" already exists.`);
    return true;
  } catch (err) {
    console.error('Exception creating bucket:', err);
    return false;
  }
};
