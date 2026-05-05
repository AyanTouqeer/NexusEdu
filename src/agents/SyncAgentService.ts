import { GoogleGenAI } from "@google/genai";
import { offlineStorage } from "../core/database.ts";
import crypto from "crypto";

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
        
        // Generate deep answer
        const prompt = `Deep Research Required for Student Query: "${item.query}"
        Please provide a detailed explanation, examples, and key takeaways.`;
        
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            systemInstruction: "You are the NexusEdu Deep Research Agent. Provide detailed, comprehensive, and accurate answers to educational queries that were queued for offline processing."
          }
        });
        const cloudAnswer = response.text;

        // Save result and update status
        offlineStorage.saveSyncResult({
          id: crypto.randomUUID(),
          student_id: item.student_id,
          original_query_id: item.id,
          cloud_answer: cloudAnswer
        });

        offlineStorage.updateSyncStatus(item.id, 'completed');
        successCount++;
        
        console.log(`SyncAgent: Successfully processed query ${item.id}`);
      } catch (error) {
        console.error(`SyncAgent: Failed to process query ${item.id} due to network/API failure. Leaving as pending.`, error);
      }
    }

    return { success: true, processed: successCount };
  }
}

export const syncAgent = new SyncAgent();
