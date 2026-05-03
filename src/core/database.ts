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
  saveQuery: (data: { id: string; subject: string; topic: string; query: string; response: string }) => {
    const stmt = db.prepare('INSERT INTO student_queries (id, subject, topic, query, response, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(data.id, data.subject, data.topic, data.query, data.response, Date.now());
  },
  getQueries: () => {
    return db.prepare('SELECT * FROM student_queries ORDER BY timestamp DESC').all();
  }
};
