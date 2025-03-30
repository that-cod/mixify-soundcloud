
/**
 * Validates a Claude API key by making a simple request to the API
 */
export async function validateClaudeApiKey(apiKey: string): Promise<{valid: boolean; message: string}> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message to validate the API key."
          }
        ]
      })
    });
    
    if (response.ok) {
      return { valid: true, message: "API key is valid and working." };
    } else {
      const errorData = await response.text();
      console.error("Claude API validation error:", errorData);
      
      if (response.status === 401) {
        return { valid: false, message: "Invalid API key. Authentication failed." };
      } else if (response.status === 429) {
        return { valid: false, message: "Rate limit exceeded. Please try again later." };
      } else {
        return { valid: false, message: `API error (${response.status}): ${response.statusText}` };
      }
    }
  } catch (error) {
    console.error("Error validating Claude API key:", error);
    return { valid: false, message: `Connection error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Validates an OpenAI API key by making a simple request to the API
 */
export async function validateOpenAIApiKey(apiKey: string): Promise<{valid: boolean; message: string}> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Hello, this is a test message to validate the API key."
          }
        ],
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      return { valid: true, message: "OpenAI API key is valid and working." };
    } else {
      const errorData = await response.text();
      console.error("OpenAI API validation error:", errorData);
      
      if (response.status === 401) {
        return { valid: false, message: "Invalid OpenAI API key. Authentication failed." };
      } else if (response.status === 429) {
        return { valid: false, message: "OpenAI rate limit exceeded. Please try again later." };
      } else {
        return { valid: false, message: `OpenAI API error (${response.status}): ${response.statusText}` };
      }
    }
  } catch (error) {
    console.error("Error validating OpenAI API key:", error);
    return { valid: false, message: `Connection error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Extracts API keys from environment variables or configuration
 */
export function getApiKeys(): { claude: string | null; openai: string | null } {
  // Get the Claude API key
  const claudeKey = "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";
  
  // Get the OpenAI API key
  const openaiKey = "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";
  
  return {
    claude: claudeKey,
    openai: openaiKey
  };
}

/**
 * Checks both Claude and OpenAI API keys
 */
export async function checkApiKeys(): Promise<{
  claude: { valid: boolean; message: string };
  openai: { valid: boolean; message: string };
}> {
  const keys = getApiKeys();
  
  const claudeResult = keys.claude 
    ? await validateClaudeApiKey(keys.claude)
    : { valid: false, message: "Claude API key not found" };
    
  const openaiResult = keys.openai
    ? await validateOpenAIApiKey(keys.openai)
    : { valid: false, message: "OpenAI API key not found" };
    
  return {
    claude: claudeResult,
    openai: openaiResult
  };
}
