
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { saveApiKey, validateOpenAIApiKey } from '@/utils/api-key-validator';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ApiKeyInputProps {
  provider: 'openai';
  onValidationComplete: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ provider, onValidationComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  
  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }
    
    setIsValidating(true);
    
    try {
      // Validate the key before saving
      const result = await validateOpenAIApiKey(apiKey);
      
      if (result.valid) {
        // Save the key to localStorage
        saveApiKey(provider, apiKey);
        
        toast({
          title: "Success",
          description: `OpenAI API key saved successfully.`,
        });
        
        // Trigger the callback to refresh key status
        onValidationComplete();
      } else {
        toast({
          title: "Validation Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to validate API key: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveKey();
    }
  };
  
  return (
    <Card className="mt-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">OpenAI API Key</CardTitle>
        <CardDescription>
          Enter your OpenAI API key to enable AI-powered features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Input
            type="password"
            placeholder="Enter OpenAI API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button 
            onClick={handleSaveKey} 
            disabled={isValidating || !apiKey}
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
