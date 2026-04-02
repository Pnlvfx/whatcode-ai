import { DatabaseSync } from 'node:sqlite';
import { homedir } from 'node:os';
import path from 'node:path';

const DB_PATH = path.join(homedir(), '.local', 'share', 'opencode', 'opencode.db');

const openDb = (): DatabaseSync | undefined => {
  try {
    return new DatabaseSync(DB_PATH, { open: true });
  } catch {
    return undefined;
  }
};

const db = openDb();

export const getLastMessageTimeByProject = (): Map<string, number> => {
  if (!db) return new Map();
  try {
    const rows = db
      .prepare('SELECT s.project_id, MAX(m.time_created) as last_msg FROM message m JOIN session s ON m.session_id = s.id GROUP BY s.project_id')
      .all() as { project_id: string; last_msg: number }[];
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.project_id, row.last_msg);
    }
    return map;
  } catch {
    return new Map();
  }
};
