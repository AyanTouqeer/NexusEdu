import { StudentQuery } from "../types";

export class SyncManager {
  static isOnline(): boolean {
    return navigator.onLine;
  }

  static async saveQuery(query: StudentQuery) {
    if (!this.isOnline()) {
      // Save to local storage cache if offline
      const cached = JSON.parse(localStorage.getItem('offline_queries') || '[]');
      cached.push(query);
      localStorage.setItem('offline_queries', JSON.stringify(cached));
      return { success: false, cached: true };
    }

    try {
      const response = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      return await response.json();
    } catch (error) {
      console.error("Sync error:", error);
      return { success: false, error: "Network error" };
    }
  }

  static async syncOfflineQueries() {
    if (!this.isOnline()) return;

    const cached: StudentQuery[] = JSON.parse(localStorage.getItem('offline_queries') || '[]');
    if (cached.length === 0) return;

    console.log(`Syncing ${cached.length} offline queries...`);
    
    for (const query of cached) {
      await this.saveQuery(query);
    }

    localStorage.setItem('offline_queries', '[]');
  }
}
