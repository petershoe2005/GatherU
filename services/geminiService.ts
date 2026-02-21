
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI | null => {
  const key = process.env.API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;
  if (!ai) ai = new GoogleGenAI({ apiKey: key });
  return ai;
};

export const getSmartDescription = async (itemTitle: string) => {
  const client = getAI();
  if (!client) return null;
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a compelling 2-sentence description for a campus listing of "${itemTitle}". Mention it's perfect for students.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const getSmartSearchHelp = async (query: string) => {
  const client = getAI();
  if (!client) return null;
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user is searching for "${query}" in a campus marketplace. Suggest 3 related specific items students might need. Return as a comma-separated list.`,
    });
    return response.text?.split(',').map(s => s.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
