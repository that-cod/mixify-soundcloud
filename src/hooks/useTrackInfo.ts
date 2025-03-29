
import { useState, useEffect } from 'react';

export const useTrackInfo = (track1Url: string | undefined, track2Url: string | undefined) => {
  // Track uploaded file info
  const [track1Info, setTrack1Info] = useState<{path: string, name: string} | null>(null);
  const [track2Info, setTrack2Info] = useState<{path: string, name: string} | null>(null);
  
  // When track URLs change, update track info
  useEffect(() => {
    if (track1Url) {
      // In a real implementation, this would store the actual path returned from the upload API
      setTrack1Info({
        path: track1Url,
        name: track1Url.split('/').pop() || 'track1.mp3'
      });
    }
  }, [track1Url]);
  
  useEffect(() => {
    if (track2Url) {
      // In a real implementation, this would store the actual path returned from the upload API
      setTrack2Info({
        path: track2Url,
        name: track2Url.split('/').pop() || 'track2.mp3'
      });
    }
  }, [track2Url]);
  
  return {
    track1Info,
    track2Info
  };
};
