
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { PromptAnalysisResult } from '@/services/anthropic-service';
import { AudioFeatures } from '@/types/audio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PromptInstructionsList } from './PromptInstructionsList';
import { useApiKeyStatus } from '@/hooks/useApiKeyStatus';

export interface PromptMixingInterfaceProps {
  isProcessing: boolean;
  processProgress: number;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  track1Name?: string;
  track2Name?: string;
  promptAnalysisResult?: PromptAnalysisResult | null;
  onPromptSubmit: (prompt: string) => void;
  onApplyAndMix: () => void;
}

export const PromptMixingInterface: React.FC<PromptMixingInterfaceProps> = ({
  isProcessing,
  processProgress,
  track1Features,
  track2Features,
  track1Name = 'Track 1',
  track2Name = 'Track 2',
  promptAnalysisResult,
  onPromptSubmit,
  onApplyAndMix
}) => {
  // Local state
  const [promptText, setPromptText] = useState('');
  const { claude, openai, isChecking } = useApiKeyStatus();
  
  // Calculate if any key is valid
  const anyKeyValid = (claude?.valid === true || openai?.valid === true);
  
  // Helper to check if we can submit (both tracks analyzed and prompt not empty)
  const canSubmit = 
    !isProcessing && 
    promptText.trim().length > 0 && 
    !!track1Features && 
    !!track2Features;
  
  // Track information to help guide the user
  const trackInfo = [
    track1Features && `${track1Name}: ${track1Features.bpm} BPM, Key: ${track1Features.key}`,
    track2Features && `${track2Name}: ${track2Features.bpm} BPM, Key: ${track2Features.key}`
  ].filter(Boolean).join(' • ');
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onPromptSubmit(promptText);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Track Information */}
      {trackInfo && (
        <div className="text-sm text-white/60 bg-white/5 p-2 rounded">
          {trackInfo}
        </div>
      )}
      
      {/* API Key Warning */}
      {!isChecking && !anyKeyValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Key Issue</AlertTitle>
          <AlertDescription>
            No valid AI API keys found. AI-powered mixing will not work correctly.
            {claude && !claude.valid && 
              <div className="mt-1">Claude: {claude.message}</div>
            }
            {openai && !openai.valid && 
              <div className="mt-1">OpenAI: {openai.message}</div>
            }
          </AlertDescription>
        </Alert>
      )}
      
      {/* Prompt Input Form */}
      {!promptAnalysisResult && (
        <Card className="glass-card border-mixify-accent/30">
          <CardHeader>
            <CardTitle>Describe Your Mix</CardTitle>
            <CardDescription>
              Tell the AI how you want to mix your tracks. Be specific about elements like vocals, beats, transitions, and effects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Example: 'Create a smooth transition between tracks. Keep the vocals from track 1 but use the beats from track 2. Add some echo effect.'"
                className="min-h-[120px] bg-black/30"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                disabled={isProcessing}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!canSubmit || !anyKeyValid}
                  className={`${isProcessing ? 'bg-mixify-purple/50' : 'bg-mixify-purple hover:bg-mixify-purple-dark'}`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing... {processProgress > 0 ? `${processProgress}%` : ''}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Mix Instructions
                    </>
                  )}
                </Button>
              </div>
              
              {!track1Features || !track2Features ? (
                <p className="text-xs text-amber-300">
                  Waiting for track analysis to complete...
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Analysis Results */}
      {promptAnalysisResult && (
        <Card className="glass-card border-mixify-accent/30">
          <CardHeader>
            <CardTitle>AI Mix Analysis</CardTitle>
            <CardDescription>
              {promptAnalysisResult.summary || "AI has analyzed your instructions and determined the optimal mix settings."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PromptInstructionsList instructions={promptAnalysisResult.instructions} />
            
            <div className="flex justify-end">
              <Button 
                onClick={onApplyAndMix}
                className="bg-mixify-purple hover:bg-mixify-purple-dark"
                disabled={isProcessing || !anyKeyValid}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Apply and Mix
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
