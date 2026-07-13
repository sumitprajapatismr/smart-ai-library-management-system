import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not defined in environment variables.');
}

export const genAI = new GoogleGenerativeAI(apiKey || 'MOCK_KEY');

// We'll use gemini-2.5-flash as it is fast and efficient for general library/text tasks
export const getGeminiModel = (modelName: string = 'gemini-2.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

const model = apiKey ? 'gemini-2.5-flash' : 'gemini-2.5-flash'; // Fallback
export default genAI;
