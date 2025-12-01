import { GoogleGenAI, Type } from "@google/genai";

// Safe access to process.env for browser environments
const getApiKey = () => {
    try {
        if (typeof process !== 'undefined' && process.env) {
            return process.env.API_KEY || '';
        }
        // Fallback if window.process is polyfilled
        // @ts-ignore
        if (typeof window !== 'undefined' && window.process && window.process.env) {
             // @ts-ignore
            return window.process.env.API_KEY || '';
        }
    } catch (e) {
        return '';
    }
    return '';
}

const API_KEY = getApiKey();

export const generateLuxuryGreetings = async (): Promise<string[]> => {
  const defaults = [
      "GOLDEN ERA",
      "PURE LUXURY",
      "WINNING SEASON",
      "GRAND CHRISTMAS",
      "RICH & MERRY",
      "SUCCESS 2025"
  ];

  if (!API_KEY) {
    console.log("Using default luxury greetings (No API Key)");
    return defaults;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate 6 ultra-short (2 words max) extremely luxury, wealthy, high-status Christmas greetings. Use words like Gold, Grand, Rich, Elite.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return defaults;
    const result = JSON.parse(text) as string[];
    return result.length > 0 ? result : defaults;
  } catch (error) {
    console.warn("Gemini Greeting Error, using defaults:", error);
    return defaults;
  }
};