
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Lightbulb, PenTool, Check, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { PromptAnalysisResult } from '@/services/anthropic-service';
import { useApiKeyStatus } from '@/hooks/useApiKeyStatus';

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
  promptAnalysisResult?: PromptAnalysisResult | null;
  onPromptSubmit: (prompt: string) => void;
  onApplyAndMix?: () => void;
}

export const PromptMixingInterface: React.FC<PromptMixingInterfaceProps> = ({
  isProcessing,
  processProgress,
  track1Features,
  track2Features,
  track1Name = "Track 1",
  track2Name = "Track 2",
  promptAnalysisResult,
  onPromptSubmit,
  onApplyAndMix,
}) => {
  const [prompt, setPrompt] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const { claude, openai, isChecking } = useApiKeyStatus();

  const hasValidApiKey = (claude && claude.valid) || (openai && openai.valid);

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

  // Determine if OpenAI was used (via the summary text)
  const wasProcessedByOpenAI = promptAnalysisResult?.summary?.includes('OpenAI') || false;

  // Render the analysis result in a readable format
  const renderAnalysisResult = () => {
    if (!promptAnalysisResult) return null;
    
    return (
      <div className="mt-4 space-y-4">
        <div className="rounded-md bg-mixify-purple/10 border border-mixify-purple/30 p-3">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-mixify-purple-light" />
            AI Mix Plan {wasProcessedByOpenAI ? "(OpenAI)" : "(Claude)"}
          </h4>
          <p className="text-sm">{promptAnalysisResult.summary}</p>
          
          <div className="mt-3 pt-3 border-t border-white/10">
            <h5 className="text-xs font-medium mb-1.5">Detected Instructions:</h5>
            <div className="space-y-1.5">
              {promptAnalysisResult.instructions
                .filter(instruction => instruction.confidence > 0.7)
                .map((instruction, idx) => (
                  <div key={idx} className="flex items-start text-xs gap-1.5">
                    <Check className="h-3 w-3 text-mixify-accent shrink-0 mt-0.5" />
                    <span>{instruction.description}</span>
                  </div>
                ))}
            </div>
          </div>
          
          {onApplyAndMix && (
            <Button 
              onClick={onApplyAndMix}
              className="mt-3 w-full bg-mixify-purple hover:bg-mixify-purple-dark"
            >
              Apply and Create Mix
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Show API key warning if no valid keys are found
  const renderApiKeyWarning = () => {
    if (isChecking) return null;
    if (hasValidApiKey) return null;
    
    return (
      <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 p-3 mb-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-400">API Key Issue Detected</p>
            <p className="text-xs text-yellow-300/80 mt-1">
              No valid AI API keys found. AI-powered mixing may not work correctly.
              {claude && !claude.valid && <span className="block mt-1">Claude API: {claude.message}</span>}
              {openai && !openai.valid && <span className="block mt-1">OpenAI API: {openai.message}</span>}
            </p>
          </div>
        </div>
      </div>
    );
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
        {/* API key status warning */}
        {renderApiKeyWarning()}

        {/* Add message about API key for hackathon */}
        <div className="rounded-md bg-green-500/10 border border-green-500/30 p-3 mb-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-green-400">Hackathon Edition</p>
              <p className="text-xs text-green-300/80 mt-1">
                Both Anthropic Claude and OpenAI APIs are integrated and ready to use. We'll use OpenAI as fallback if Claude fails.
              </p>
            </div>
          </div>
        </div>

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
            {/* Analysis result display */}
            {promptAnalysisResult && renderAnalysisResult()}

            {!promptAnalysisResult && (
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
                    disabled={!prompt.trim() || !track1Features || !track2Features || (!hasValidApiKey && !isChecking)}
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
          </>
        )}
      </CardContent>
    </Card>
  );
};
