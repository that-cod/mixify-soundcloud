
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Lightbulb, PenTool } from 'lucide-react';

interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
}

interface PromptMixingInterfaceProps {
  isProcessing: boolean;
  processProgress: number;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  track1Name?: string;
  track2Name?: string;
  onPromptSubmit: (prompt: string) => void;
}

export const PromptMixingInterface: React.FC<PromptMixingInterfaceProps> = ({
  isProcessing,
  processProgress,
  track1Features,
  track2Features,
  track1Name = "Track 1",
  track2Name = "Track 2",
  onPromptSubmit,
}) => {
  const [prompt, setPrompt] = useState("");
  const [showExamples, setShowExamples] = useState(false);

  const examplePrompts = [
    `Mix ${track1Name} and ${track2Name} with equal vocal levels and adjust to 128 BPM`,
    `Create a progressive build from ${track1Name} to ${track2Name} with a long crossfade`,
    `Match the keys of both tracks and emphasize the drums from ${track2Name}`,
    `Create a festival-style mix with high energy drops and transitions between both tracks`
  ];

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setShowExamples(false);
  };

  const handleSubmit = () => {
    if (prompt.trim()) {
      onPromptSubmit(prompt.trim());
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5 text-mixify-purple-light" />
          AI-Powered Mixing
        </CardTitle>
        <CardDescription>
          Describe how you want your tracks mixed and let AI handle the details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProcessing ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="h-8 w-8 text-mixify-purple-light animate-spin mb-4" />
            <p className="text-white/70 mb-2">Processing your mixing instructions...</p>
            <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-mixify-purple to-mixify-accent" 
                style={{ width: `${processProgress}%` }}
              />
            </div>
            <p className="text-xs text-white/50 mt-2">{processProgress}% complete</p>
          </div>
        ) : (
          <>
            <div className="rounded-md bg-white/5 p-3 text-sm">
              <p className="mb-2 text-white/80">Available track information:</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-white/60">Track 1: </span>
                  <span className="text-white/90">{track1Name}</span>
                  {track1Features && (
                    <p className="mt-1 text-white/70">
                      {track1Features.bpm} BPM, Key: {track1Features.key}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-white/60">Track 2: </span>
                  <span className="text-white/90">{track2Name}</span>
                  {track2Features && (
                    <p className="mt-1 text-white/70">
                      {track2Features.bpm} BPM, Key: {track2Features.key}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm mb-2 block text-white/80">
                How would you like your tracks mixed?
              </label>
              <Textarea
                placeholder="Example: Match the BPM of both tracks, emphasize vocals from track 1, and create a smooth transition between them..."
                className="bg-white/10 border-white/20 text-white min-h-[100px]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
                className="text-white/70"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                {showExamples ? "Hide Examples" : "Show Examples"}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!prompt.trim() || !track1Features || !track2Features}
                className="bg-mixify-purple hover:bg-mixify-purple-dark"
              >
                Generate Mix
              </Button>
            </div>

            {showExamples && (
              <div className="mt-2 space-y-2 rounded-md bg-white/5 p-3">
                <p className="text-sm text-white/80 mb-2">Example prompts:</p>
                <div className="space-y-2">
                  {examplePrompts.map((example, index) => (
                    <div 
                      key={index}
                      className="text-xs p-2 bg-white/10 rounded cursor-pointer hover:bg-white/15"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
