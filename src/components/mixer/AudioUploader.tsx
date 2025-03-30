
import React from 'react';
import { useAudioUpload } from './uploader/useAudioUpload';
import { BucketCheckLoader } from './uploader/BucketCheckLoader';
import { BucketStatusAlert } from './uploader/BucketStatusAlert';
import { DropZone } from './uploader/DropZone';
import { FilePreview } from './uploader/FilePreview';
import { AUDIO_BUCKET } from '@/services/storage-service';
import { AlertTriangle } from 'lucide-react';

interface AudioUploaderProps {
  trackNumber: 1 | 2;
  onUploadComplete: (url: string, fileName: string) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ trackNumber, onUploadComplete }) => {
  const {
    file,
    uploading,
    progress,
    bucketStatus,
    bucketCheckInProgress,
    uploadError,
    onDrop,
    uploadFile,
    removeFile,
  } = useAudioUpload({ trackNumber, onUploadComplete });

  return (
    <div className="space-y-4 w-full">
      {/* Bucket check loader */}
      <BucketCheckLoader isLoading={bucketCheckInProgress} />
      
      {/* Bucket status alerts */}
      {!bucketCheckInProgress && bucketStatus && (
        <BucketStatusAlert 
          bucketStatus={bucketStatus}
          bucketName={AUDIO_BUCKET}
        />
      )}
      
      {/* File upload area */}
      {!file ? (
        <DropZone 
          onDrop={onDrop}
          acceptedFileTypes={{
            'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
          }}
        />
      ) : (
        <FilePreview
          file={file}
          uploading={uploading}
          progress={progress}
          onRemove={removeFile}
          onUpload={uploadFile}
          trackNumber={trackNumber}
          uploadError={uploadError}
        />
      )}
    </div>
  );
};
