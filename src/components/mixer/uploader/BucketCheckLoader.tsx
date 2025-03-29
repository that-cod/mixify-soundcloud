
import React from 'react';
import { Loader2 } from 'lucide-react';

interface BucketCheckLoaderProps {
  isLoading: boolean;
}

export const BucketCheckLoader: React.FC<BucketCheckLoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <div className="flex items-center justify-center p-4 bg-black/20 rounded-lg">
      <Loader2 className="h-5 w-5 text-mixify-purple animate-spin mr-2" />
      <p className="text-sm text-white/70">Verifying storage access...</p>
    </div>
  );
};
