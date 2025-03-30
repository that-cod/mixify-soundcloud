
import { useState, useEffect, useCallback } from 'react';
import { checkApiKeys } from '@/utils/api-key-validator';

interface ApiKeyStatus {
  claude: { valid: boolean; message: string } | null;
  openai: { valid: boolean; message: string } | null;
  isChecking: boolean;
  error: string | null;
  checkKeys: () => Promise<void>;
  anyKeyValid: boolean;
}

export function useApiKeyStatus(): ApiKeyStatus {
  const [status, setStatus] = useState<Omit<ApiKeyStatus, 'checkKeys' | 'anyKeyValid'>>({
    claude: null,
    openai: null,
    isChecking: true,
    error: null
  });

  const validateKeys = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));
    try {
      console.log("Checking API keys...");
      const result = await checkApiKeys();
      console.log("API key check result:", result);
      setStatus({
        claude: result.claude,
        openai: result.openai,
        isChecking: false,
        error: null
      });
    } catch (error) {
      console.error("Error checking API keys:", error);
      setStatus({
        claude: null,
        openai: null,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Unknown error checking API keys'
      });
    }
  }, []);

  useEffect(() => {
    validateKeys();
  }, [validateKeys]);

  // Calculate if any key is valid
  const anyKeyValid = (status.claude?.valid || status.openai?.valid) === true;

  return {
    ...status,
    checkKeys: validateKeys,
    anyKeyValid
  };
}
