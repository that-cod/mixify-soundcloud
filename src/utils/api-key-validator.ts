
import Anthropic from '@anthropic-ai/sdk';

/**
 * Validates a Claude API key by making a simple request to the API
 */
export async function validateClaudeApiKey(apiKey: string): Promise<{valid: boolean; message: string}> {
  try {
    console.log("Validating Claude API key...");
    
    // Create Anthropic client with the API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });
    
    // Make a test request to validate the key
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 10,
      messages: [
        { role: "user", content: "Hello, this is a test message to validate the API key." }
      ],
    });
    
    console.log("Claude API validation response:", response.id ? "Valid" : "Invalid");
    
    if (response.id) {
      return { valid: true, message: "API key is valid and working." };
    } else {
      return { valid: false, message: "Invalid API key response." };
    }
  } catch (error) {
    console.error("Error validating Claude API key:", error);
    
    // Handle specific error types
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return { valid: false, message: "Invalid API key. Authentication failed." };
      } else if (error.status === 429) {
        return { valid: false, message: "Rate limit exceeded. Please try again later." };
      } else {
        return { valid: false, message: `API error (${error.status}): ${error.message}` };
      }
    }
    
    return { valid: false, message: `Connection error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Validates an OpenAI API key by making a simple request to the API
 */
export async function validateOpenAIApiKey(apiKey: string): Promise<{valid: boolean; message: string}> {
  try {
    console.log("Validating OpenAI API key...");
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
    
    const responseText = await response.text();
    console.log("OpenAI API validation response:", response.status, responseText);
    
    if (response.ok) {
      return { valid: true, message: "OpenAI API key is valid and working." };
    } else {
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
  // Get the Claude API key - updated to use the new key
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
  
  console.log("Checking Claude API key:", keys.claude ? "provided" : "not provided");
  console.log("Checking OpenAI API key:", keys.openai ? "provided" : "not provided");
  
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
