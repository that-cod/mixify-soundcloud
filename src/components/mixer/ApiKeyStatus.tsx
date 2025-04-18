
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiKeyStatus } from '@/hooks/useApiKeyStatus';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiKeyInput } from './ApiKeyInput';

export const ApiKeyStatus: React.FC = () => {
  const { openai, isChecking, error, checkKeys } = useApiKeyStatus();
  
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
  
  const anyKeyValid = openai?.valid === true;
  
  return (
    <Card className="glass-card mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>API Key Status</CardTitle>
          <CardDescription>
            Enter your OpenAI API key to enable AI-powered mixing features
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={checkKeys} 
          disabled={isChecking}
          title="Refresh API key status"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isChecking ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-8 w-8 text-mixify-purple-light animate-spin" />
            <span className="ml-2">Checking API key...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-white/5">
              <h3 className="text-sm font-medium mb-2">OpenAI API</h3>
              {renderStatus(openai, "OpenAI")}
              {!openai?.valid && <ApiKeyInput provider="openai" onValidationComplete={checkKeys} />}
            </div>
            
            {!anyKeyValid && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>API Key Required</AlertTitle>
                <AlertDescription>
                  Please enter a valid OpenAI API key to use AI-powered mixing features.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <p className="text-xs text-white/60 mt-2">
          Note: Your API key is stored locally in your browser and is never sent to our servers.
          This key is required for AI-powered mixing features to work.
        </p>
      </CardContent>
    </Card>
  );
}
