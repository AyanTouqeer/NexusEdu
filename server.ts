import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { offlineStorage } from "./src/core/database.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health Check Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "nexus-edu-backend", timestamp: new Date().toISOString() });
  });

  // Core Offline-First /Ask Route
  app.post("/api/ask", async (req, res) => {
    const { student_id, question, subject, topic, requires_deep_research } = req.body;
    const educator = new (await import("./src/agents/EdgeEducator.ts")).EdgeEducator();

    // OFFLINE FIRST: Try to handle locally (Edge AI)
    if (!requires_deep_research) {
      try {
        const localAnswer = await educator.tutor(subject || "General", topic || "Tutoring", question);
        return res.json({
          status: "success",
          source: "local_edge",
          answer: localAnswer
        });
      } catch (error) {
        // Fallback to queue if local AI fails
        offlineStorage.saveForSync(student_id, question);
        return res.json({
          status: "queued",
          message: "Edge AI busy. Saved to offline queue."
        });
      }
    }

    // ONLINE ENHANCEMENT: Queue heavy tasks
    offlineStorage.saveForSync(student_id, question);
    res.json({
      status: "queued",
      message: "Great question! This requires a deep dive. I've saved it and will get the answer the next time we connect to the cloud."
    });
  });

  // Deep Sync Agent Trigger
  app.get("/api/trigger-sync", async (req, res) => {
    // Run in background without blocking response
    import("./src/agents/SyncAgentService.ts").then(({ syncAgent }) => {
      syncAgent.processOfflineQueue().catch(err => console.error("Background sync failed:", err));
    });
    
    res.json({ 
      status: "Sync initiated", 
      message: "Checking offline queue in the background..." 
    });
  });

  app.get("/api/synced-results/:student_id", (req, res) => {
    try {
      const results = offlineStorage.getSyncedResults(req.params.student_id);
      res.json(results);
    } catch (error) {
      console.error("Fetch synced results error:", error);
      res.status(500).json({ error: "Failed to fetch synced results" });
    }
  });

  // Deep Sync Agent Trigger (Legacy POST for compatibility)
  app.post("/api/sync", async (req, res) => {
    try {
      const { syncAgent } = await import("./src/agents/SyncAgentService.ts");
      const result = await syncAgent.processOfflineQueue();
      res.json(result);
    } catch (error) {
      console.error("Manual sync error:", error);
      res.status(500).json({ error: "Sync processing failed" });
    }
  });

  // Offline Storage API
  app.post("/api/queries", (req, res) => {
    try {
      const { id, subject, topic, query, response } = req.body;
      offlineStorage.saveQuery({ id, subject, topic, query, response });
      res.status(201).json({ success: true });
    } catch (error) {
      console.error("Database save error:", error);
      res.status(500).json({ error: "Failed to save query" });
    }
  });

  app.get("/api/queries", (req, res) => {
    try {
      const queries = offlineStorage.getQueries();
      res.json(queries);
    } catch (error) {
      console.error("Database fetch error:", error);
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  });

  app.post("/api/gamify", async (req, res) => {
    const { content } = req.body;
    try {
      const { ContextTranslator } = await import("./src/agents/ContextTranslator.ts");
      const game = await ContextTranslator.gamify(content);
      res.json({ success: true, game });
    } catch (error) {
      console.error("Gamification error:", error);
      res.status(500).json({ error: "Gamification failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production setup
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NexusEdu backend running on http://localhost:${PORT}`);
  });
}

startServer();
