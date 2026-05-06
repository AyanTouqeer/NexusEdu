export class ContextTranslator {
  static async gamify(content: string) {
    try {
      const prompt = `Transform this educational content into a 3-step mini-game prompt. Content: ${content}. Format as: 
        1. Context/Setting
        2. Challenge
        3. Reward`;

      // Rerouted directly to your local edge hardware
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "phi3", // Your locally downloaded AI
          prompt: prompt,
          system: "You are the NexusEdu Gamification Engine. Your job is to make learning highly engaging by turning concepts into game-like challenges.",
          stream: false, // Wait for the whole prompt to generate
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama connection failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.response; // The offline gamified text!

    } catch (error) {
      console.error("Local Gamification error:", error);
      // If the engine isn't running, it gracefully falls back to this:
      return "Unlock the mystery by reviewing the core principles!";
    }
  }
}
