export class EdgeEducator {
  // This is the Agent's "Buffer Memory"
  private memory: { role: string; content: string }[] = [];

  constructor() {
    // We inject the Socratic personality into the system core on boot
    this.memory.push({
      role: "system",
      content: "You are the NexusEdu Edge Educator, an expert offline AI tutor. NEVER give direct answers. You must use the Socratic method. Respond with guiding questions, relatable real-world analogies, and encourage the student to think critically. Keep responses concise."
    });
  }

  async tutor(subject: string, topic: string, studentQuery: string) {
    try {
      console.log(`[EdgeEducator] Processing live query for ${topic}...`);

      // 1. Add the student's exact question to the agent's memory
      this.memory.push({
        role: "user",
        content: `Context - Subject: ${subject}, Topic: ${topic}. Student says: ${studentQuery}`
      });

      // 2. Send the ENTIRE memory array to local hardware (Phi-3)
      const response = await fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen2:0.5b",
          messages: this.memory,
          stream: false,
          options: {
            temperature: 0.3, 
            num_gpu: 0 // <-- THIS STOPS THE CRASH BY FORCING CPU MODE
          }
        })
      });

      // 3. Reveal exactly why Ollama crashes if it fails again
      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Ollama Crash Details: ${errorDetails}`);
      }

      const data = await response.json();
      const aiResponse = data.message.content;

      // 4. Save the AI's response to memory so it remembers for next time!
      this.memory.push({
        role: "assistant",
        content: aiResponse
      });

      return aiResponse;

    } catch (error) {
      console.error("[EdgeEducator] Fatal Core Error:", error);
      throw error; 
    }
  }
}

// Export a singleton instance so memory persists across frontend renders
export const edgeEducator = new EdgeEducator();
