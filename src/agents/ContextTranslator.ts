import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class ContextTranslator {
  static async gamify(content: string) {
    try {
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
