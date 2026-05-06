import { StudentQuery } from "../types";

// We define the local backend URL explicitly
const LOCAL_API_URL = "http://localhost:3000/api/queries";

export class SyncManager {
  /**
   * Instead of checking for Internet, we check if our 
   * local NexusEdu backend is reachable.
   */
  static async isBackendAlive(): Promise<boolean> {
    try {
      const response = await fetch("http://localhost:3000/health", { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async saveQuery(query: StudentQuery) {
    const backendReady = await this.isBackendAlive();

    if (!backendReady) {
      // If the local Node server is off, cache it in the browser
      console.warn("Local backend unreachable. Caching query in browser storage...");
      const cached = JSON.parse(localStorage.getItem('offline_queries') || '[]');
      cached.push({ ...query, timestamp: new Date().toISOString() });
      localStorage.setItem('offline_queries', JSON.stringify(cached));
      return { success: false, cached: true, message: "Saved to local cache" };
    }

    try {
      // Always try to hit the local AI agents first
      const response = await fetch(LOCAL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      return await response.json();
    } catch (error) {
      console.error("Local sync error:", error);
      return { success: false, error: "Local Server Error" };
    }
  }

  /**
   * This now syncs browser cache to the local SQLite database
   */
  static async syncToLocalDatabase() {
    const backendReady = await this.isBackendAlive();
    if (!backendReady) return;

    const cached: StudentQuery[] = JSON.parse(localStorage.getItem('offline_queries') || '[]');
    if (cached.length === 0) return;

    console.log(`NexusEdu: Syncing ${cached.length} browser-cached queries to local SQLite...`);
    
    for (const query of cached) {
      await this.saveQuery(query);
    }

    localStorage.setItem('offline_queries', '[]');
  }
}
