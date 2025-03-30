import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, ArrowRightIcon } from 'lucide-react';
import { PromptInstructionsList } from './PromptInstructionsList';
import { AudioFeatures } from '@/types/audio';
import { PromptAnalysisResult } from '@/services/anthropic-service';
import { useApiKeyStatus } from '@/hooks/useApiKeyStatus';

interface PromptMixingInterfaceProps {
  isProcessing: boolean;
  processProgress: number;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  track1Name?: string;
  track2Name?: string;
  promptAnalysisResult: PromptAnalysisResult | null;
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
  const [promptText, setPromptText] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [exampleSelected, setExampleSelected] = useState(false);
  const { anyKeyValid } = useApiKeyStatus();
  
  // Function to set example prompt
  const setExamplePrompt = (example: string) => {
    setPromptText(example);
    setExampleSelected(true);
    setShowExamples(false);
  };
  
  // Examples of prompts
  const examples = [
    `Create a high-energy EDM mix that emphasizes the vocals from ${track1Name} and the beats from ${track2Name}. Increase the tempo and add strong echo effects.`,
    `Make a smooth R&B transition between the tracks, lowering the vocals on ${track2Name} and keeping the melody from ${track1Name}. Use a long crossfade.`,
    `Create a remix that sounds like a professional DJ set. Use the vocal parts from ${track1Name} over the beats of ${track2Name}, with a classic build-up and drop structure.`
  ];
  
  // Reset prompt when tracks change
  useEffect(() => {
    if (!exampleSelected) {
      setPromptText('');
    }
  }, [track1Name, track2Name]);
  
  // Handle prompt submission
  const handleSubmit = () => {
    if (promptText.trim() && !isProcessing) {
      onPromptSubmit(promptText);
    }
  };
  
  // If analysis is complete, show the results and "Apply and Mix" button
  if (promptAnalysisResult) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>AI Mix Analysis</CardTitle>
          <CardDescription>
            {promptAnalysisResult.summary || "The AI has analyzed your instructions and determined the optimal mix settings."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromptInstructionsList instructions={promptAnalysisResult.instructions} />
          
          {/* Apply and Mix button */}
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={onApplyAndMix}
              className="bg-mixify-purple hover:bg-mixify-purple-dark"
            >
              <ArrowRightIcon className="mr-2 h-4 w-4" />
              Apply and Mix
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Otherwise, show the prompt input interface
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>AI Prompt Mixing</CardTitle>
        <CardDescription>
          Tell the AI how you want your tracks mixed, and it will create the perfect mix for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* API Key Status Warning */}
          {!anyKeyValid && (
            <div className="bg-red-900/20 border border-red-800/30 text-red-400 p-3 rounded-md text-sm mb-3">
              <p className="font-medium mb-1">API Key Required</p>
              <p>You need to add a valid Claude or OpenAI API key to use this feature. Check the API Key Status below.</p>
            </div>
          )}
          
          <Textarea
            placeholder={`Describe how you want your tracks mixed. For example: "Create a high-energy EDM mix that emphasizes the vocals from ${track1Name} and the beats from ${track2Name}..."`}
            className="min-h-[120px] bg-black/40"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={isProcessing}
          />
          
          {/* Show examples toggle */}
          <div className="text-sm text-white/60">
            <button 
              className="underline text-mixify-accent text-xs"
              onClick={() => setShowExamples(!showExamples)}
            >
              {showExamples ? "Hide examples" : "Show examples"}
            </button>
            
            {showExamples && (
              <div className="mt-2 space-y-2">
                {examples.map((example, index) => (
                  <div 
                    key={index} 
                    className="p-2 bg-white/5 rounded cursor-pointer hover:bg-white/10"
                    onClick={() => setExamplePrompt(example)}
                  >
                    {example}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={!promptText.trim() || isProcessing || !anyKeyValid || !track1Features || !track2Features}
              className="bg-mixify-purple hover:bg-mixify-purple-dark"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing... {processProgress > 0 ? `${processProgress}%` : ''}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
          
          {(!track1Features || !track2Features) && (track1Features || track2Features) && (
            <p className="text-xs text-amber-300 mt-2">Waiting for track analysis to complete...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
