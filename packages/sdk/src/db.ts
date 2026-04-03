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

const queryV1 = 'SELECT s.project_id, MAX(m.time_created) as last_msg FROM message m JOIN session s ON m.session_id = s.id GROUP BY s.project_id';
// const queryV2 =
//   'SELECT project_id, MAX(t) as last_msg FROM (SELECT project_id, time_updated as t FROM session UNION ALL SELECT s.project_id, m.time_updated FROM message m JOIN session s ON m.session_id = s.id) GROUP BY project_id';

export const getLastMessageTimeByProject = (): Map<string, number> => {
  if (!db) return new Map();
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const rows = db.prepare(queryV1).all() as { project_id: string; last_msg: number }[];
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.project_id, row.last_msg);
    }
    return map;
  } catch {
    return new Map();
  }
};
