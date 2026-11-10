import type { ModelRef } from '@opencode/client';
import type { Failure, Success } from '../compiled/core/try-catch.ts';
import { DatabaseSync } from 'node:sqlite';
import { homedir } from 'node:os';
import path from 'node:path';
import * as z from 'zod/v4/mini';
import { parseError } from '../compiled/core/error.ts';
import { logger } from '../logger.ts';

export interface SessionSummary {
  lastModel: ModelRef | undefined;
  title: string | undefined;
  timeIdle: number | undefined;
  timeViewed: number | undefined;
  outcome: 'succeeded' | 'failed' | 'interrupted' | undefined;
}

export interface ProjectLatestSession {
  sessionId: string;
  title: string | undefined;
}

const DB_PATH = path.join(homedir(), '.local', 'share', 'opencode', 'opencode.db');
const BUSY_TIMEOUT_MS = 2000;

const queryLastMessageTime =
  'SELECT s.project_id, MAX(sm.time_created) as last_msg FROM session_message sm JOIN session_v2 s ON sm.session_id = s.id GROUP BY s.project_id';

const querySessionSummary = 'SELECT id, model, title, time_idle, time_viewed, idle_outcome FROM session_v2 WHERE id IN (';

const queryUnreadRootSessionCount = `
  SELECT COUNT(*) AS count
  FROM session_v2
  WHERE parent_id IS NULL AND time_idle IS NOT NULL AND (time_viewed IS NULL OR time_idle > time_viewed)
`;

const queryLatestSessionByProject = `
  SELECT id, project_id, title
  FROM session_v2
  WHERE parent_id IS NULL AND (project_id, time_updated) IN (
    SELECT project_id, MAX(time_updated) FROM session_v2 WHERE parent_id IS NULL GROUP BY project_id
  )
`;

/* eslint-disable no-restricted-properties -- opencode owns this schema, unknown keys must not fail the request */
const lastMessageRowSchema = z.looseObject({ project_id: z.string(), last_msg: z.number() });

const sessionSummaryRowSchema = z.looseObject({
  id: z.string(),
  model: z.nullable(z.string()),
  title: z.nullable(z.string()),
  time_idle: z.nullable(z.number()),
  time_viewed: z.nullable(z.number()),
  idle_outcome: z.nullable(z.string()),
});

const countRowSchema = z.looseObject({ count: z.number() });
const latestSessionRowSchema = z.looseObject({ id: z.string(), project_id: z.string(), title: z.nullable(z.string()) });
const modelRefSchema = z.looseObject({ id: z.string(), providerID: z.string(), variant: z.optional(z.string()) });
/* eslint-enable no-restricted-properties */

export const getLastMessageTimeByProject = (): Success<Map<string, number>> | Failure<Error> => {
  const rows = selectRows(queryLastMessageTime, lastMessageRowSchema, []);
  return rows.error ? rows : { data: new Map(rows.data.map((row) => [row.project_id, row.last_msg])) };
};

// Fetches the last model used and title for a list of session IDs.
export const getSessionSummaries = (sessionIds: string[]): Success<Map<string, SessionSummary>> | Failure<Error> => {
  if (sessionIds.length === 0) return { data: new Map() };

  const placeholders = sessionIds.map(() => '?').join(', ');
  const rows = selectRows(`${querySessionSummary}${placeholders})`, sessionSummaryRowSchema, sessionIds);
  if (rows.error) return rows;

  const summaries = new Map<string, SessionSummary>();

  for (const row of rows.data) {
    const lastModel = parseModel(row.model);
    if (lastModel.error) logger.warn('session', `Ignoring the model of session ${row.id}: ${lastModel.error.message}`);
    summaries.set(row.id, {
      lastModel: lastModel.data,
      title: row.title ?? undefined,
      timeIdle: row.time_idle ?? undefined,
      timeViewed: row.time_viewed ?? undefined,
      outcome: toOutcome(row.idle_outcome),
    });
  }

  return { data: summaries };
};

// Counts root sessions whose idle watermark is newer than the viewed one, same rule as getSessionUnread in the app.
export const getUnreadSessionCount = (): Success<number> | Failure<Error> => {
  const rows = selectRows(queryUnreadRootSessionCount, countRowSchema, []);
  if (rows.error) return rows;
  const row = rows.data.at(0);
  return row ? { data: row.count } : { error: new Error('The opencode database returned no unread session count') };
};

// Returns the most recently updated session ID and title per project.
// Used as a fallback when the client has no locally stored session for a project.
export const getLatestSessionByProject = (): Success<Map<string, ProjectLatestSession>> | Failure<Error> => {
  const rows = selectRows(queryLatestSessionByProject, latestSessionRowSchema, []);
  return rows.error ? rows : { data: new Map(rows.data.map((row) => [row.project_id, { sessionId: row.id, title: row.title ?? undefined }])) };
};

const attempt = <T>(run: () => T): Success<T> | Failure<Error> => {
  try {
    return { data: run() };
  } catch (error) {
    return { error: parseError(error) };
  }
};

const validate = <T>(schema: z.ZodMiniType<T>, value: unknown): Success<T> | Failure<Error> => {
  const parsed = z.safeParse(schema, value);
  return parsed.success ? { data: parsed.data } : { error: new Error(`Unexpected opencode database data\n${z.prettifyError(parsed.error)}`) };
};

const selectRows = <T>(sql: string, rowSchema: z.ZodMiniType<T>, params: string[]): Success<T[]> | Failure<Error> => {
  const queried = attempt(() => {
    const db = new DatabaseSync(DB_PATH, { readOnly: true, timeout: BUSY_TIMEOUT_MS });
    try {
      return db.prepare(sql).all(...params);
    } finally {
      db.close();
    }
  });
  return queried.error ? queried : validate(z.array(rowSchema), queried.data);
};

const parseModel = (model: string | null): Success<ModelRef | undefined> | Failure<Error> => {
  if (model === null) return { data: undefined };
  const json = attempt((): unknown => JSON.parse(model));
  if (json.error) return json;
  const parsed = validate(modelRefSchema, json.data);
  return parsed.error
    ? parsed
    : {
        data: { id: parsed.data.id, providerID: parsed.data.providerID, ...(parsed.data.variant !== undefined && { variant: parsed.data.variant }) },
      };
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
