
import { useState, useEffect, useCallback } from 'react';
import { checkApiKeys, getApiKeys } from '@/utils/api-key-validator';

interface ApiKeyStatus {
  openai: { valid: boolean; message: string } | null;
  isChecking: boolean;
  error: string | null;
  checkKeys: () => Promise<void>;
  anyKeyValid: boolean;
}

export function useApiKeyStatus(): ApiKeyStatus {
  const [status, setStatus] = useState<Omit<ApiKeyStatus, 'checkKeys' | 'anyKeyValid'>>({
    openai: null,
    isChecking: true,
    error: null
  });

  const validateKeys = useCallback(async () => {
    console.log("Starting API key validation...");
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));
    try {
      // First check if keys exist
      const keys = getApiKeys();
      console.log("Retrieved API keys:", keys.openai ? "OpenAI key exists" : "No OpenAI key");
      
      if (!keys.openai) {
        setStatus({
          openai: { valid: false, message: 'No OpenAI API key provided' },
          isChecking: false,
          error: null
        });
        return;
      }
      
      // Basic format validation before making API call
      if (!keys.openai.startsWith('sk-') || keys.openai.length < 40) {
        setStatus({
          openai: { valid: false, message: 'OpenAI API key format is invalid' },
          isChecking: false,
          error: null
        });
        return;
      }

      console.log("Checking API keys with validation service...");
      const result = await checkApiKeys();
      console.log("API key check result:", result);
      setStatus({
        openai: result.openai,
        isChecking: false,
        error: null
      });
    } catch (error) {
      console.error("Error checking API keys:", error);
      setStatus(prev => ({
        ...prev,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Unknown error checking API keys'
      }));
    }
  }, []);

  useEffect(() => {
    validateKeys();
  }, [validateKeys]);

  // Calculate if OpenAI key is valid
  const anyKeyValid = Boolean(status.openai && status.openai.valid === true);

  return {
    ...status,
    checkKeys: validateKeys,
    anyKeyValid
  };
}
