
import axios from 'axios';

// API key storage keys
const OPENAI_KEY_STORAGE_KEY = 'openai-api-key';

// Types for API key validation
interface ApiKeyValidationResult {
  valid: boolean;
  message: string;
}

interface ApiKeyCheckResult {
  openai: ApiKeyValidationResult | null;
}

// Get API keys from localStorage
export function getApiKeys() {
  return {
    openai: localStorage.getItem(OPENAI_KEY_STORAGE_KEY) || ''
  };
}

// Save API key to localStorage
export function saveApiKey(provider: 'openai', key: string) {
  localStorage.setItem(OPENAI_KEY_STORAGE_KEY, key);
}

// Check if API keys are valid
export async function checkApiKeys(): Promise<ApiKeyCheckResult> {
  const apiKeys = getApiKeys();
  const result: ApiKeyCheckResult = {
    openai: null
  };

  // Check OpenAI API key if present
  if (apiKeys.openai) {
    result.openai = await validateOpenAIApiKey(apiKeys.openai);
  } else {
    result.openai = {
      valid: false,
      message: 'No OpenAI API key provided'
    };
  }

  return result;
}

// Validate OpenAI API key
export async function validateOpenAIApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return {
      valid: false,
      message: 'OpenAI API key is required'
    };
  }

  try {
    // Make a simple API call to check if the key is valid
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.status === 200) {
      return {
        valid: true,
        message: 'OpenAI API key is valid'
      };
    } else {
      return {
        valid: false,
        message: `OpenAI API key validation failed: ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('Error validating OpenAI API key:', error);
    
    let errorMessage = 'Invalid API key';
    
    // Extract more specific error information if available
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key.';
      } else if (error.response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else {
        errorMessage = `API error: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    
    return {
      valid: false,
      message: errorMessage
    };
  }
}

export default {
  getApiKeys,
  saveApiKey,
  checkApiKeys,
  validateOpenAIApiKey
};
