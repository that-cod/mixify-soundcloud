
const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Claude client (using your hardcoded key for now)
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "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";

/**
 * Analyze a mixing prompt using AI (Claude or OpenAI)
 * @param {string} prompt User prompt for mixing
 * @param {Object} track1Features Features of track 1
 * @param {Object} track2Features Features of track 2
 * @returns {Promise<Object>} Analysis result
 */
async function analyzePrompt(prompt, track1Features, track2Features) {
  try {
    // Create system prompt
    const systemPrompt = createSystemPrompt(track1Features, track2Features);
    
    // Use Claude API for analysis
    const analysisResult = await analyzeWithClaude(systemPrompt, prompt);
    
    return analysisResult;
  } catch (error) {
    console.error('Prompt analysis error:', error);
    
    // Fallback to default analysis if AI analysis fails
    return createDefaultAnalysis(track1Features, track2Features);
  }
}

/**
 * Create system prompt for AI based on track features
 * @param {Object} track1Features Features of track 1
 * @param {Object} track2Features Features of track 2
 * @returns {string} System prompt
 */
function createSystemPrompt(track1Features, track2Features) {
  return `You are an AI audio mixing assistant that specializes in analyzing user instructions for mixing two musical tracks.

TRACK INFORMATION:
- Track 1: BPM: ${track1Features.bpm}, Key: ${track1Features.key}, Energy: ${track1Features.energy}, Clarity: ${track1Features.clarity}
- Track 2: BPM: ${track2Features.bpm}, Key: ${track2Features.key}, Energy: ${track2Features.energy}, Clarity: ${track2Features.clarity}

Your job is to analyze a user's text prompt and extract specific mixing instructions. 

You should respond ONLY with a JSON object (no explanations or other text) that has the following structure:
{
  "instructions": [
    {
      "type": "bpm", // one of: bpm, key, vocals, beats, transition, effects, tempo, general
      "description": "Match the tempo of both tracks",
      "value": true, // can be number, boolean or string depending on type
      "confidence": 0.9 // how confident you are this is what the user wants, 0-1
    }
    // more instructions...
  ],
  "summary": "A short summary of the mixing plan in 1-2 sentences",
  "recommendedSettings": {
    "bpmMatch": true, // boolean
    "keyMatch": true, // boolean
    "vocalLevel1": 0.8, // 0-1 scale
    "vocalLevel2": 0.5, // 0-1 scale
    "beatLevel1": 0.6, // 0-1 scale
    "beatLevel2": 0.8, // 0-1 scale
    "crossfadeLength": 8, // seconds (1-20)
    "echo": 0.2, // 0-1 scale
    "tempo": 0 // -0.5 to 0.5, 0 means no change
  }
}

Understand music terminology and extract both explicit and implicit instructions from the user's prompt. For instance, if they ask for a "smooth transition," that implies a longer crossfadeLength.`;
}

/**
 * Analyze prompt using Claude API
 * @param {string} systemPrompt System prompt
 * @param {string} userPrompt User prompt
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeWithClaude(systemPrompt, userPrompt) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    try {
      // Parse the JSON response from Claude
      const content = data.content[0].text;
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      throw new Error('Failed to parse Claude response');
    }
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

/**
 * Create default analysis if AI analysis fails
 * @param {Object} track1Features Features of track 1
 * @param {Object} track2Features Features of track 2
 * @returns {Object} Default analysis
 */
function createDefaultAnalysis(track1Features, track2Features) {
  // Create sensible defaults based on track features
  const shouldMatchBpm = Math.abs(track1Features.bpm - track2Features.bpm) > 5;
  const shouldMatchKey = track1Features.key !== track2Features.key;
  
  return {
    instructions: [
      {
        type: "bpm",
        description: "Match the tempo of both tracks",
        value: shouldMatchBpm,
        confidence: 0.9
      },
      {
        type: "key",
        description: "Harmonize the keys of both tracks",
        value: shouldMatchKey,
        confidence: 0.9
      },
      {
        type: "transition",
        description: "Create a smooth transition between tracks",
        value: 8,
        confidence: 0.8
      }
    ],
    summary: "Balance both tracks with automatic BPM and key matching for a professional sound.",
    recommendedSettings: {
      bpmMatch: shouldMatchBpm,
      keyMatch: shouldMatchKey,
      vocalLevel1: 0.8,
      vocalLevel2: 0.5,
      beatLevel1: 0.6,
      beatLevel2: 0.8,
      crossfadeLength: 8,
      echo: 0.2,
      tempo: 0
    }
  };
}

module.exports = {
  analyzePrompt
};
