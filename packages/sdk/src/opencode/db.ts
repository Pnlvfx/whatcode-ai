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
  timeIdle: number | undefined;
  timeViewed: number | undefined;
  outcome: 'succeeded' | 'failed' | 'interrupted' | undefined;
}

// Fetches the last model used and title for a list of session IDs.
// Reads directly from the opencode SQLite DB — stateless, no writes.
const querySessionSummary = 'SELECT id, model, title, time_idle, time_viewed, idle_outcome FROM session_v2 WHERE id IN (';

export const getSessionSummaries = (sessionIds: string[]): Map<string, SessionSummary> => {
  const result = new Map<string, SessionSummary>();
  if (!db || sessionIds.length === 0) return result;

  const placeholders = sessionIds.map(() => '?').join(', ');

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const rows = db.prepare(`${querySessionSummary}${placeholders})`).all(...sessionIds) as {
      id: string;
      model: string | undefined;
      title: string | undefined;
      time_idle: number | null;
      time_viewed: number | null;
      idle_outcome: string | null;
    }[];
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
      result.set(row.id, {
        lastModel,
        title: row.title ?? undefined,
        timeIdle: row.time_idle ?? undefined,
        timeViewed: row.time_viewed ?? undefined,
        outcome: toOutcome(row.idle_outcome),
      });
    }
  } catch {
    // DB unavailable or schema changed — return empty rather than crash
  }

  return result;
};

const queryUnreadRootSessionCount = `
  SELECT COUNT(*) AS count
  FROM session_v2
  WHERE parent_id IS NULL AND time_idle IS NOT NULL AND (time_viewed IS NULL OR time_idle > time_viewed)
`;

// Counts root sessions whose idle watermark is newer than the viewed one, same rule as getSessionUnread in the app.
export const getUnreadSessionCount = (): number => {
  if (!db) throw new Error('opencode database is unavailable');
  const row = db.prepare(queryUnreadRootSessionCount).get();
  if (!row) throw new Error('Unexpected unread session count result');
  const { count } = row;
  if (typeof count !== 'number') throw new TypeError('Unexpected unread session count result');
  return count;
};

const toOutcome = (value: string | null): SessionSummary['outcome'] => {
  switch (value) {
    case 'succeeded':
    case 'failed':
    case 'interrupted': {
      return value;
    }
    default: {
      return undefined;
    }
  }
};

export interface ProjectLatestSession {
  sessionId: string;
  title: string;
}

const queryLatestSessionByProject = `
  SELECT id, project_id, title
  FROM session_v2
  WHERE parent_id IS NULL AND (project_id, time_updated) IN (
    SELECT project_id, MAX(time_updated) FROM session_v2 WHERE parent_id IS NULL GROUP BY project_id
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
