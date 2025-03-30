
import { useState, useEffect, useCallback } from 'react';
import { checkApiKeys } from '@/utils/api-key-validator';

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
      console.log("Checking API keys...");
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
