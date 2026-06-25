import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Parse comma-separated API keys from environment variable
const API_KEYS = process.env.GEMINI_API_KEYS 
  ? process.env.GEMINI_API_KEYS.split(',').map(key => key.trim()).filter(Boolean)
  : [process.env.GEMINI_API_KEY || ''];

interface KeyState {
  key: string;
  isResting: boolean;
  restUntil: number;
}

const keysState: KeyState[] = API_KEYS.map(key => ({
  key,
  isResting: false,
  restUntil: 0
}));

const RATE_LIMIT_PER_KEY = 10;
const REST_DURATION_MS = 60 * 1000; // 1 minute rest
let requestCount = 0;
let currentKeyIndex = 0;

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % keysState.length;
  requestCount = 0;
  console.log(`Rotated Gemini API Key to index ${currentKeyIndex}`);
}

function markCurrentKeyAsResting() {
  console.log(`Putting key index ${currentKeyIndex} into rest mode for ${REST_DURATION_MS / 1000}s.`);
  keysState[currentKeyIndex].isResting = true;
  keysState[currentKeyIndex].restUntil = Date.now() + REST_DURATION_MS;
  rotateKey(); // immediately shift to the next key
}

function getActiveApiKey(): string {
  const now = Date.now();
  
  // Check if current key needs to rotate due to nominal rate limit
  if (requestCount >= RATE_LIMIT_PER_KEY) {
    rotateKey();
  }
  
  // Ensure the current key isn't resting
  let attempts = 0;
  while (keysState[currentKeyIndex].isResting && keysState[currentKeyIndex].restUntil > now && attempts < keysState.length) {
    rotateKey();
    attempts++;
  }
  
  const state = keysState[currentKeyIndex];
  requestCount++;
  
  return state.key;
}

// Default model – you can switch to 'gemini-1.5-pro' for complex tasks
const defaultModel = 'gemini-1.5-flash';

export function getGeminiModel(model: string = defaultModel): GenerativeModel {
  const apiKey = getActiveApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model });

  // Intercept generateContent to handle 429/quota errors seamlessly
  const originalGenerateContent = geminiModel.generateContent.bind(geminiModel);
  
  // @ts-ignore
  geminiModel.generateContent = async (...args: any[]) => {
    try {
      // @ts-ignore
      return await originalGenerateContent(...args);
    } catch (error: any) {
      const errorMsg = error?.message?.toLowerCase() || '';
      // If it's a rate limit or quota error
      if (error?.status === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('too many') || errorMsg.includes('exhausted')) {
        console.warn('API Key exhausted before limit, shifting to next key and resting current key.');
        markCurrentKeyAsResting();
        // Retry with a new model using the next active key
        const nextModel = getGeminiModel(model);
        // @ts-ignore
        return await nextModel.generateContent(...args);
      }
      throw error; // Rethrow other errors
    }
  };

  return geminiModel;
}

// For streaming responses (e.g., chat)
export async function generateGeminiResponse(prompt: string, model: string = defaultModel): Promise<string> {
  const geminiModel = getGeminiModel(model);
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}
