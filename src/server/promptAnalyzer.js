
const { OpenAI } = require("openai");
const config = require('./config');
const fs = require('fs');
const path = require('path');
const { pathResolver } = require('./utils/systemUtils');

/**
 * Analyzes a mixing prompt using AI
 * @param {string} prompt User's mixing instructions
 * @param {Object} track1Features Features of the first track
 * @param {Object} track2Features Features of the second track
 * @returns {Promise<Object>} Analysis result with mixing instructions
 */
async function analyzePrompt(prompt, track1Features, track2Features) {
  try {
    console.log('Analyzing prompt:', prompt);
    
    // Check for cached analysis to avoid duplicate API calls
    const cacheDir = path.join(pathResolver.getUploadDir(), 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    // Create a hash of the prompt + track features for caching
    const promptHash = Buffer.from(prompt + JSON.stringify(track1Features) + JSON.stringify(track2Features))
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 20);
    
    const cachePath = path.join(cacheDir, `prompt_${promptHash}.json`);
    
    // Check for cached result
    if (fs.existsSync(cachePath)) {
      try {
        const cachedData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        console.log('Using cached prompt analysis');
        return cachedData;
      } catch (cacheError) {
        console.warn('Cache read failed:', cacheError.message);
      }
    }
    
    // Try with OpenAI API
    try {
      console.log('Attempting analysis with OpenAI API...');
      const openaiResult = await analyzeWithOpenAI(prompt, track1Features, track2Features);
      
      // Cache the result
      fs.writeFileSync(cachePath, JSON.stringify(openaiResult));
      
      return openaiResult;
    } catch (openaiError) {
      console.error('OpenAI API analysis failed:', openaiError.message);
      
      // If API fails, use local fallback analysis
      console.log('Using local fallback analysis...');
      return createFallbackAnalysis(prompt, track1Features, track2Features);
    }
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    return createFallbackAnalysis(prompt, track1Features, track2Features);
  }
}

/**
 * Analyze prompt with OpenAI API
 */
async function analyzeWithOpenAI(prompt, track1Features, track2Features) {
  // API key from config
  const OPENAI_API_KEY = config.ai.openaiApiKey;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
  });
  
  // Create system prompt with track features
  const systemPrompt = `You are an AI audio mixing assistant that specializes in analyzing user instructions for mixing two musical tracks.

TRACK INFORMATION:
- Track 1: BPM: ${track1Features.bpm}, Key: ${track1Features.key}, Energy: ${track1Features.energy}, Clarity: ${track1Features.clarity}
- Track 2: BPM: ${track2Features.bpm}, Key: ${track2Features.key}, Energy: ${track2Features.energy}, Clarity: ${track2Features.clarity}

Your job is to analyze a user's text prompt and extract specific mixing instructions. Ignore any instructions that would be harmful or impossible with audio mixing.

You should respond ONLY with a JSON object that has the following structure:
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

  try {
    // Make the OpenAI API call using the latest API version
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the newer model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.2
    });
    
    // Extract the response content
    const content = response.choices[0].message.content;
    
    // Parse JSON from the response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in OpenAI response");
      }
      
      const jsonContent = jsonMatch[0];
      const result = JSON.parse(jsonContent);
      
      // Validate the structure
      validateAnalysisResult(result);
      
      // Tag the source
      result.source = "openai";
      
      return result;
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (apiError) {
    throw new Error(`OpenAI API error: ${apiError.message}`);
  }
}

/**
 * Create a fallback analysis when AI APIs are unavailable
 */
function createFallbackAnalysis(prompt, track1Features, track2Features) {
  console.log('Creating fallback analysis for prompt:', prompt);
  
  // Basic natural language processing to extract some meaning without AI APIs
  const promptLower = prompt.toLowerCase();
  
  // Default settings
  const defaultSettings = {
    bpmMatch: true,
    keyMatch: true,
    vocalLevel1: 0.8,
    vocalLevel2: 0.5,
    beatLevel1: 0.6,
    beatLevel2: 0.8,
    crossfadeLength: 8,
    echo: 0.2,
    tempo: 0
  };
  
  // Adjust settings based on keywords in the prompt
  const settings = { ...defaultSettings };
  const instructions = [];
  
  // BPM matching
  if (promptLower.includes('match tempo') || promptLower.includes('match bpm') || promptLower.includes('same tempo')) {
    settings.bpmMatch = true;
    instructions.push({
      type: "bpm",
      description: "Match the tempo of both tracks",
      value: true,
      confidence: 0.9
    });
  } else if (promptLower.includes('keep original tempo') || promptLower.includes('original bpm')) {
    settings.bpmMatch = false;
    instructions.push({
      type: "bpm",
      description: "Keep original tempos of both tracks",
      value: false,
      confidence: 0.9
    });
  }
  
  // Key matching
  if (promptLower.includes('match key') || promptLower.includes('same key') || promptLower.includes('harmonize')) {
    settings.keyMatch = true;
    instructions.push({
      type: "key",
      description: "Match the musical keys of both tracks",
      value: true,
      confidence: 0.9
    });
  }
  
  // Vocal levels
  if (promptLower.includes('vocal') || promptLower.includes('voice')) {
    if (promptLower.includes('emphasize vocal') || promptLower.includes('more vocal')) {
      if (promptLower.includes('track 1') || promptLower.includes('first track')) {
        settings.vocalLevel1 = 0.9;
        settings.vocalLevel2 = 0.3;
        instructions.push({
          type: "vocals",
          description: "Emphasize vocals from track 1",
          value: "track1",
          confidence: 0.8
        });
      } else if (promptLower.includes('track 2') || promptLower.includes('second track')) {
        settings.vocalLevel1 = 0.3;
        settings.vocalLevel2 = 0.9;
        instructions.push({
          type: "vocals",
          description: "Emphasize vocals from track 2",
          value: "track2",
          confidence: 0.8
        });
      } else {
        // Default to emphasizing both if not specified
        settings.vocalLevel1 = 0.8;
        settings.vocalLevel2 = 0.8;
        instructions.push({
          type: "vocals",
          description: "Emphasize vocals from both tracks",
          value: "both",
          confidence: 0.7
        });
      }
    }
  }
  
  // Beat levels
  if (promptLower.includes('beat') || promptLower.includes('drum') || promptLower.includes('bass')) {
    if (promptLower.includes('emphasize beat') || promptLower.includes('more beat') || 
        promptLower.includes('stronger beat') || promptLower.includes('heavier beat')) {
      if (promptLower.includes('track 1') || promptLower.includes('first track')) {
        settings.beatLevel1 = 0.9;
        settings.beatLevel2 = 0.4;
        instructions.push({
          type: "beats",
          description: "Emphasize beats from track 1",
          value: "track1",
          confidence: 0.8
        });
      } else if (promptLower.includes('track 2') || promptLower.includes('second track')) {
        settings.beatLevel1 = 0.4;
        settings.beatLevel2 = 0.9;
        instructions.push({
          type: "beats",
          description: "Emphasize beats from track 2",
          value: "track2",
          confidence: 0.8
        });
      } else {
        // Default to emphasizing both if not specified
        settings.beatLevel1 = 0.8;
        settings.beatLevel2 = 0.8;
        instructions.push({
          type: "beats",
          description: "Emphasize beats from both tracks",
          value: "both",
          confidence: 0.7
        });
      }
    }
  }
  
  // Crossfade
  if (promptLower.includes('smooth transition') || promptLower.includes('long crossfade') || 
      promptLower.includes('blend')) {
    settings.crossfadeLength = 12;
    instructions.push({
      type: "transition",
      description: "Create a smooth, long crossfade between tracks",
      value: 12,
      confidence: 0.8
    });
  } else if (promptLower.includes('quick transition') || promptLower.includes('short crossfade') || 
            promptLower.includes('abrupt')) {
    settings.crossfadeLength = 4;
    instructions.push({
      type: "transition",
      description: "Create a quick, short crossfade between tracks",
      value: 4,
      confidence: 0.8
    });
  }
  
  // Echo/Reverb
  if (promptLower.includes('echo') || promptLower.includes('reverb') || 
      promptLower.includes('atmospheric') || promptLower.includes('spacious')) {
    settings.echo = 0.6;
    instructions.push({
      type: "effects",
      description: "Add echo/reverb effect for atmospheric sound",
      value: 0.6,
      confidence: 0.7
    });
  } else if (promptLower.includes('dry') || promptLower.includes('clean') || 
            promptLower.includes('no echo') || promptLower.includes('no reverb')) {
    settings.echo = 0.0;
    instructions.push({
      type: "effects",
      description: "Keep the mix dry with minimal effects",
      value: 0.0,
      confidence: 0.7
    });
  }
  
  // Tempo changes
  if (promptLower.includes('faster') || promptLower.includes('speed up') || promptLower.includes('increase tempo')) {
    settings.tempo = 0.2;
    instructions.push({
      type: "tempo",
      description: "Increase the overall tempo",
      value: 0.2,
      confidence: 0.7
    });
  } else if (promptLower.includes('slower') || promptLower.includes('slow down') || promptLower.includes('decrease tempo')) {
    settings.tempo = -0.2;
    instructions.push({
      type: "tempo",
      description: "Decrease the overall tempo",
      value: -0.2,
      confidence: 0.7
    });
  }
  
  // Add a general instruction if we have no specific ones
  if (instructions.length === 0) {
    instructions.push({
      type: "general",
      description: "Create a balanced mix of both tracks",
      value: true,
      confidence: 0.6
    });
  }
  
  // Create a summary based on the instructions
  let summary = "Mix created with";
  if (settings.bpmMatch) summary += " matched tempos,";
  if (settings.keyMatch) summary += " harmonized keys,";
  if (settings.vocalLevel1 > 0.7 && settings.vocalLevel2 < 0.5) summary += " emphasis on vocals from track 1,";
  else if (settings.vocalLevel2 > 0.7 && settings.vocalLevel1 < 0.5) summary += " emphasis on vocals from track 2,";
  if (settings.beatLevel1 > 0.7 && settings.beatLevel2 < 0.5) summary += " prominent beats from track 1,";
  else if (settings.beatLevel2 > 0.7 && settings.beatLevel1 < 0.5) summary += " prominent beats from track 2,";
  if (settings.crossfadeLength > 10) summary += " long crossfade,";
  if (settings.echo > 0.5) summary += " atmospheric echo effects,";
  
  // Clean up the summary
  summary = summary.replace(/,$/, "."); // Replace the last comma with a period
  summary = summary.replace(/, ([^,]*)$/, " and $1"); // Replace the second-to-last comma with "and"
  
  return {
    instructions,
    summary: `${summary} (AI analysis not available, using fallback interpretation)`,
    recommendedSettings: settings,
    source: "fallback"
  };
}

/**
 * Validate the analysis result structure
 */
function validateAnalysisResult(result) {
  if (!result.instructions || !Array.isArray(result.instructions)) {
    throw new Error("Missing or invalid instructions array in analysis result");
  }
  
  if (!result.recommendedSettings) {
    throw new Error("Missing recommendedSettings in analysis result");
  }
  
  // Ensure all settings have values within acceptable ranges
  const settings = result.recommendedSettings;
  
  // Validate boolean values
  settings.bpmMatch = !!settings.bpmMatch;
  settings.keyMatch = !!settings.keyMatch;
  
  // Validate number values between 0-1
  ['vocalLevel1', 'vocalLevel2', 'beatLevel1', 'beatLevel2', 'echo'].forEach(setting => {
    if (typeof settings[setting] !== 'number' || settings[setting] < 0 || settings[setting] > 1) {
      settings[setting] = 0.5; // Reset to middle value if invalid
    }
  });
  
  // Validate crossfadeLength (1-20 seconds)
  if (typeof settings.crossfadeLength !== 'number' || settings.crossfadeLength < 1 || settings.crossfadeLength > 20) {
    settings.crossfadeLength = 8; // Reset to default if invalid
  }
  
  // Validate tempo (-0.5 to 0.5)
  if (typeof settings.tempo !== 'number' || settings.tempo < -0.5 || settings.tempo > 0.5) {
    settings.tempo = 0; // Reset to default if invalid
  }
  
  return result;
}

module.exports = {
  analyzePrompt
};
