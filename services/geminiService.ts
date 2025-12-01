import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const generateLuxuryGreetings = async (): Promise<string[]> => {
  if (!API_KEY) {
    console.warn("No API Key found, using fallback greetings.");
    return [
      "Merry Christmas",
      "Golden Holidays",
      "Luxury Awaits",
      "Grand Celebration",
      "Prosperity & Joy"
    ];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate 6 short, ultra-luxury, high-class Christmas greetings (max 4 words each) suitable for a gold-themed gala.",
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
    if (!text) return ["Seasons Greetings"];
    return JSON.parse(text) as string[];
  } catch (error) {
    console.error("Gemini Greeting Error:", error);
    return ["Merry Christmas", "Pure Luxury", "Golden Season", "Grand Joy"];
  }
};
