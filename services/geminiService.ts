
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getSmartDescription = async (itemTitle: string) => {
  if (!process.env.API_KEY) return null;
  try {
    const response = await ai.models.generateContent({
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
  if (!process.env.API_KEY) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user is searching for "${query}" in a campus marketplace. Suggest 3 related specific items students might need. Return as a comma-separated list.`,
    });
    return response.text?.split(',').map(s => s.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
