
import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformDisplayProps {
  audioUrl?: string;
  color?: string;
  height?: number;
  onReady?: (wavesurfer: WaveSurfer) => void;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  audioUrl,
  color = '#9b87f5',
  height = 80,
  onReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: color,
      progressColor: '#FF5500',
      cursorColor: 'rgba(255, 255, 255, 0.5)',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: height,
      normalize: true,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    });

    wavesurferRef.current = wavesurfer;

    // Handle events
    wavesurfer.on('ready', () => {
      if (onReady) onReady(wavesurfer);
    });

    wavesurfer.on('error', (err) => {
      console.error('WaveSurfer error:', err);
    });

    // Clean up on unmount
    return () => {
      wavesurfer.destroy();
    };
  }, [color, height, onReady]);

  // Load audio when URL changes
  useEffect(() => {
    if (wavesurferRef.current && audioUrl) {
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

  // If no audio URL, show placeholder animation
  if (!audioUrl) {
    return (
      <div className="waveform-container flex items-center justify-center p-4">
        <div className="flex items-end space-x-1 h-full">
          {Array.from({ length: 30 }).map((_, index) => (
            <div
              key={index}
              className="animated-waveform-bar w-1.5 h-full"
              style={{
                height: `${Math.random() * 60 + 10}%`,
                '--index': index,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="waveform-container" />;
};
