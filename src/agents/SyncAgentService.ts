import { offlineStorage } from "../core/database.ts";
import crypto from "crypto";

// The Google GenAI imports and setup have been completely removed!

export class SyncAgent {
  async processOfflineQueue() {
    console.log("SyncAgent: Checking for pending offline queries...");
    const pendingItems = offlineStorage.getPendingQueue();

    if (pendingItems.length === 0) {
      console.log("SyncAgent: No pending items found.");
      return { success: true, processed: 0 };
    }

    let successCount = 0;

    for (const item of pendingItems) {
      try {
        console.log(`SyncAgent: Processing query ${item.id} for student ${item.student_id}...`);
        
        const prompt = `Deep Research Required for Student Query: "${item.query}"
        Please provide a detailed explanation, examples, and key takeaways.`;
        
        // 1. Direct API call to your local hardware (Ollama)
        const response = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "phi3", // Using your local downloaded model
            prompt: prompt,
            system: "You are the NexusEdu Deep Research Agent. Provide detailed, comprehensive, and accurate answers to educational queries that were queued for offline processing.",
            stream: false, // Wait for the full deep-dive answer to generate
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama connection failed with status: ${response.status}`);
        }

        const data = await response.json();
        const deepAnswer = data.response; // The AI's offline response!

        // 2. Save result back to the local SQLite database
        offlineStorage.saveSyncResult({
          id: crypto.randomUUID(),
          student_id: item.student_id,
          original_query_id: item.id,
          cloud_answer: deepAnswer // Keeping the property name to match your DB schema, even though it's local now!
        });

        offlineStorage.updateSyncStatus(item.id, 'completed');
        successCount++;
        
        console.log(`SyncAgent: Successfully processed query ${item.id}`);
      } catch (error) {
        console.error(`SyncAgent: Failed to process query ${item.id} locally. Leaving as pending.`, error);
      }
    }

    return { success: true, processed: successCount };
  }
}

export const syncAgent = new SyncAgent();
