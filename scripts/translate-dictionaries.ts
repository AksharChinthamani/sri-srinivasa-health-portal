import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_KEYS = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',') : [process.env.GEMINI_API_KEY].filter(Boolean);

if (API_KEYS.length === 0) {
  console.error("No GEMINI_API_KEY found in .env");
  process.exit(1);
}

let currentKeyIndex = 0;
let genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]!);
let model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

function rotateKey() {
  currentKeyIndex++;
  if (currentKeyIndex >= API_KEYS.length) {
    throw new Error("All API keys have been exhausted or expired.");
  }
  console.log(`Switching to API key index ${currentKeyIndex}...`);
  genAI = new GoogleGenerativeAI(API_KEYS[currentKeyIndex]!);
  model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
}

const dictionaryPath = path.join(process.cwd(), 'extracted_dictionary.json');
const dictionary: Record<string, string> = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));

// Only process the 'auto' keys
const keys = Object.keys(dictionary);
const batchSize = 50;

async function translateBatch(values: string[], language: string): Promise<string[]> {
  const prompt = `Translate the following array of English strings into ${language}. 
Maintain the exact array length and order. Only return a valid JSON array of strings, nothing else. 
Do NOT include markdown formatting like \`\`\`json.
If a string is an abbreviation, UI element like "Loading...", or medical term, use the most natural appropriate term in ${language}.

Strings to translate:
${JSON.stringify(values, null, 2)}`;

  let retries = 3;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      let text = result.response.text().trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (text.startsWith('```')) {
        text = text.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const translatedArray = JSON.parse(text);
      if (!Array.isArray(translatedArray) || translatedArray.length !== values.length) {
        throw new Error("Returned array length mismatch");
      }
      return translatedArray;
    } catch (e: any) {
      console.error(`Translation failed (retries left: ${retries - 1}): ${e.message}`);
      if (e.message.includes('expired') || e.message.includes('403') || e.message.includes('429')) {
        try {
          rotateKey();
          continue; // immediately retry with new key
        } catch (rotateError) {
           console.error("No more keys to rotate to.");
        }
      }
      retries--;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return values; // Fallback to english if completely fails
}

async function generateTranslationFile(langCode: string, langName: string) {
  console.log(`Starting translation for ${langName}...`);
  const translatedDict: Record<string, string> = {};
  
  for (let i = 0; i < keys.length; i += batchSize) {
    const batchKeys = keys.slice(i, i + batchSize);
    const batchValues = batchKeys.map(k => dictionary[k]);
    
    console.log(`Translating batch ${i} to ${i + batchKeys.length} for ${langName}...`);
    const translatedValues = await translateBatch(batchValues, langName);
    
    for (let j = 0; j < batchKeys.length; j++) {
      translatedDict[batchKeys[j]] = translatedValues[j];
    }
  }
  
  const existingFilePath = path.join(process.cwd(), 'src', 'lib', 'i18n', `${langCode}.ts`);

  const fileContent = `export const ${langCode} = {
  common: {
    app_name: 'Sri Srinivasa Health Portal',
    welcome: 'Welcome',
    logout: 'Logout',
    settings: 'Settings',
  },
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
  },
  dashboard: {
    good_morning: 'Good Morning',
    good_afternoon: 'Good Afternoon',
    good_evening: 'Good Evening',
    summary: 'Here is a summary of your health and activities today.',
    upcoming_appointment: 'Upcoming Appointment',
    active_prescriptions: 'Active Prescriptions',
    pending_orders: 'Pending Orders',
    quick_actions: 'Quick Actions',
  },
  auto: ${JSON.stringify(translatedDict, null, 4)}
};
`;

  fs.writeFileSync(existingFilePath, fileContent);
  console.log(`Saved translations to ${existingFilePath}`);
}

async function main() {
  await generateTranslationFile('hi', 'Hindi');
  await generateTranslationFile('te', 'Telugu');
  console.log("All translations completed!");
}

main().catch(console.error);
