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

export interface AgentConfig {
  systemInstruction: string;
  model: string;
}

export class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async run(prompt: string) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: this.config.model,
        contents: prompt,
        config: {
          systemInstruction: this.config.systemInstruction,
        },
      });
      return response.text;
    } catch (error) {
      console.error(`${this.constructor.name} error:`, error);
      throw error;
    }
  }
}

export class EdgeEducator extends BaseAgent {
  constructor() {
    super({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are the NexusEdu Edge Educator, an offline AI tutor for students in developing regions.
            Your goal is NOT to give direct answers. You must use the Socratic method.
            
            Respond with a guiding question or a highly relatable, localized analogy to help the student figure it out themselves.`
    });
  }

  async tutor(subject: string, topic: string, studentQuery: string) {
    const prompt = `Student context: (Subject: ${subject}, Topic: ${topic})
    Student Question: "${studentQuery}"
    
    Respond as a Socratic tutor using guiding questions or analogies.`;
    
    try {
      return await this.run(prompt);
    } catch (error) {
      console.warn("Edge Educator AI failed, using fallback mock response.");
      return "Socratic Tutor Mode: Let's dive into that! But before I just give you the answer, how would you break this topic down into smaller, logical steps?";
    }
  }
}
