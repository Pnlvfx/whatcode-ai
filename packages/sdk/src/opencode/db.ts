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

const queryV1 = 'SELECT s.project_id, MAX(sm.time_created) as last_msg FROM session_message sm JOIN session_v2 s ON sm.session_id = s.id GROUP BY s.project_id';

export const getLastMessageTimeByProject = (): Map<string, number> => {
  if (!db) return new Map();
  let rows: { project_id: string; last_msg: number }[];
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    rows = db.prepare(queryV1).all() as { project_id: string; last_msg: number }[];
  } catch {
    return new Map();
  }

  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(row.project_id, row.last_msg);
  }

  return map;
};

export interface SessionModelRef {
  id: string;
  providerID: string;
  variant?: string;
}

export interface SessionSummary {
  lastModel: SessionModelRef | undefined;
  title: string | undefined;
}

// Fetches the last model used and title for a list of session IDs.
// Reads directly from the opencode SQLite DB — stateless, no writes.
const querySessionSummary = 'SELECT id, model, title FROM session_v2 WHERE id IN (';

export const getSessionSummaries = (sessionIds: string[]): Map<string, SessionSummary> => {
  const result = new Map<string, SessionSummary>();
  if (!db || sessionIds.length === 0) return result;

  const placeholders = sessionIds.map(() => '?').join(', ');

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const rows = db.prepare(`${querySessionSummary}${placeholders})`).all(...sessionIds) as { id: string; model: string | undefined; title: string | undefined }[];
    for (const row of rows) {
      let lastModel: SessionModelRef | undefined;
      if (row.model) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          lastModel = JSON.parse(row.model) as SessionModelRef;
        } catch {
          // malformed JSON — skip
        }
      }
      result.set(row.id, { lastModel, title: row.title ?? undefined });
    }
  } catch {
    // DB unavailable or schema changed — return empty rather than crash
  }

  return result;
};

export interface ProjectLatestSession {
  sessionId: string;
  title: string;
}

const queryLatestSessionByProject = `
  SELECT id, project_id, title
  FROM session_v2
  WHERE (project_id, time_updated) IN (
    SELECT project_id, MAX(time_updated) FROM session_v2 GROUP BY project_id
  )
`;

// Returns the most recently updated session ID and title per project.
// Used as a fallback when the client has no locally stored session for a project.
export const getLatestSessionByProject = (): Map<string, ProjectLatestSession> => {
  if (!db) return new Map();
  let rows: { id: string; project_id: string; title: string }[];
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    rows = db.prepare(queryLatestSessionByProject).all() as { id: string; project_id: string; title: string }[];
  } catch {
    return new Map();
  }

  const map = new Map<string, ProjectLatestSession>();
  for (const row of rows) {
    map.set(row.project_id, { sessionId: row.id, title: row.title });
  }
  return map;
};
