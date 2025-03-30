
import { useState, useEffect } from 'react';
import { checkApiKeys } from '@/utils/api-key-validator';

interface ApiKeyStatus {
  claude: { valid: boolean; message: string } | null;
  openai: { valid: boolean; message: string } | null;
  isChecking: boolean;
  error: string | null;
}

export function useApiKeyStatus() {
  const [status, setStatus] = useState<ApiKeyStatus>({
    claude: null,
    openai: null,
    isChecking: true,
    error: null
  });

  useEffect(() => {
    const validateKeys = async () => {
      try {
        const result = await checkApiKeys();
        setStatus({
          claude: result.claude,
          openai: result.openai,
          isChecking: false,
          error: null
        });
      } catch (error) {
        setStatus({
          claude: null,
          openai: null,
          isChecking: false,
          error: error instanceof Error ? error.message : 'Unknown error checking API keys'
        });
      }
    };

    validateKeys();
  }, []);

  return status;
}
