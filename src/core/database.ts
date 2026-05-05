import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'nexus_edu.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    query TEXT,
    status TEXT DEFAULT 'pending',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sync_results (
    id TEXT PRIMARY KEY,
    student_id TEXT,
    original_query_id INTEGER,
    cloud_answer TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(original_query_id) REFERENCES sync_queue(id)
  );

  CREATE TABLE IF NOT EXISTS student_queries (
    id TEXT PRIMARY KEY,
    subject TEXT,
    topic TEXT,
    query TEXT,
    response TEXT,
    timestamp INTEGER
  );
`);

export const offlineStorage = {
  saveForSync: (studentId: string, query: string) => {
    const stmt = db.prepare('INSERT INTO sync_queue (student_id, query) VALUES (?, ?)');
    return stmt.run(studentId, query);
  },
  getPendingQueue: () => {
    return db.prepare("SELECT * FROM sync_queue WHERE status = 'pending'").all() as any[];
  },
  updateSyncStatus: (id: number, status: 'pending' | 'completed' | 'failed') => {
    const stmt = db.prepare('UPDATE sync_queue SET status = ? WHERE id = ?');
    stmt.run(status, id);
  },
  saveSyncResult: (data: { id: string; student_id: string; original_query_id: number; cloud_answer: string }) => {
    const stmt = db.prepare('INSERT INTO sync_results (id, student_id, original_query_id, cloud_answer) VALUES (?, ?, ?, ?)');
    stmt.run(data.id, data.student_id, data.original_query_id, data.cloud_answer);
  },
  getSyncedResults: (studentId: string) => {
    return db.prepare('SELECT * FROM sync_results WHERE student_id = ? ORDER BY timestamp DESC').all(studentId);
  },
  saveQuery: (data: { id: string; subject: string; topic: string; query: string; response: string }) => {
    const stmt = db.prepare('INSERT INTO student_queries (id, subject, topic, query, response, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(data.id, data.subject, data.topic, data.query, data.response, Date.now());
  },
  getQueries: () => {
    return db.prepare('SELECT * FROM student_queries ORDER BY timestamp DESC').all();
  }
};
