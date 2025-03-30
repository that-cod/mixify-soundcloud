
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { checkApiKeys } from '@/utils/api-key-validator';
import { Button } from '@/components/ui/button';
import { useApiKeyStatus } from '@/hooks/useApiKeyStatus';

export const ApiKeyStatus: React.FC = () => {
  const { claude, openai, isChecking, error, checkKeys } = useApiKeyStatus();
  
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>API Key Status</CardTitle>
          <CardDescription>
            Check if the API keys used for AI mixing are valid and working
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
            <span className="ml-2">Checking API keys...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-white/5">
              <h3 className="text-sm font-medium mb-2">Anthropic Claude API</h3>
              {renderStatus(claude, "Claude")}
            </div>
            
            <div className="p-3 rounded-md bg-white/5">
              <h3 className="text-sm font-medium mb-2">OpenAI API</h3>
              {renderStatus(openai, "OpenAI")}
            </div>
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
          Note: API keys are stored in the server's .env file and are used for AI-powered mixing features.
        </p>
      </CardContent>
    </Card>
  );
}
