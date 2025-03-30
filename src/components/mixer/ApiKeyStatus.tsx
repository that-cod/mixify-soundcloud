
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { checkApiKeys } from '@/utils/api-key-validator';

export const ApiKeyStatus: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<{valid: boolean; message: string} | null>(null);
  const [openaiStatus, setOpenaiStatus] = useState<{valid: boolean; message: string} | null>(null);
  
  useEffect(() => {
    const checkKeys = async () => {
      setIsChecking(true);
      try {
        const result = await checkApiKeys();
        setClaudeStatus(result.claude);
        setOpenaiStatus(result.openai);
      } catch (error) {
        console.error("Error checking API keys:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkKeys();
  }, []);
  
  const renderStatus = (status: {valid: boolean; message: string} | null, name: string) => {
    if (!status) {
      return (
        <div className="flex items-center text-yellow-500">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Checking {name} API key...
        </div>
      );
    }
    
    if (status.valid) {
      return (
        <div className="flex items-center text-green-500">
          <CheckCircle className="h-4 w-4 mr-2" />
          {status.message}
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-500">
          <AlertCircle className="h-4 w-4 mr-2" />
          {status.message}
        </div>
      );
    }
  };
  
  return (
    <Card className="glass-card mt-4">
      <CardHeader>
        <CardTitle>API Key Status</CardTitle>
        <CardDescription>
          Check if the API keys used for AI mixing are valid and working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isChecking ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-8 w-8 text-mixify-purple-light animate-spin" />
            <span className="ml-2">Checking API keys...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-white/5">
              <h3 className="text-sm font-medium mb-2">Anthropic Claude API</h3>
              {renderStatus(claudeStatus, "Claude")}
            </div>
            
            <div className="p-3 rounded-md bg-white/5">
              <h3 className="text-sm font-medium mb-2">OpenAI API</h3>
              {renderStatus(openaiStatus, "OpenAI")}
            </div>
          </div>
        )}
        
        <p className="text-xs text-white/60 mt-2">
          Note: API keys are stored in the server's .env file and are used for AI-powered mixing features.
        </p>
      </CardContent>
    </Card>
  );
}
