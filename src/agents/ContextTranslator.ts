import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export class ContextTranslator {
  static async gamify(content: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Transform this educational content into a 3-step mini-game prompt. Content: ${content}. Format as: 
        1. Context/Setting
        2. Challenge
        3. Reward`,
      });
      return response.text;
    } catch (error) {
      console.error("Gamification error:", error);
      return "Unlock the mystery by reviewing the core principles!";
    }
  }
}
