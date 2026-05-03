import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    
    return await this.run(prompt);
  }
}
