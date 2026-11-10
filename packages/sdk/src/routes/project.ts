import type { WhatCodeClient } from '../opencode/client.ts';
import { Hono } from 'hono';
import { logger } from '../logger.ts';
import { getLastMessageTimeByProject, getLatestSessionByProject } from '../opencode/db.ts';

export const createProjectRouterOverride = (client: WhatCodeClient) => {
  return new Hono().basePath('/api/project').get('/', async (c) => {
    const projects = await client.project.list();
    if (projects.error) return c.json({ message: projects.error.message }, 400);
    const lastMessageTimes = getLastMessageTimeByProject();
    const latestSessions = getLatestSessionByProject();
    if (lastMessageTimes.error) logger.warn('project', `Using the default project sort, last message times are unavailable: ${lastMessageTimes.error.message}`);
    if (latestSessions.error) logger.warn('project', `Latest sessions are unavailable: ${latestSessions.error.message}`);
    return c.json(
      projects.data.map((project) => {
        const lastMsg = lastMessageTimes.data?.get(project.id);
        const latestSession = latestSessions.data?.get(project.id);
        return {
          ...project,
          ...(lastMsg !== undefined && { time: { ...project.time, updated: lastMsg } }),
          ...(latestSession !== undefined && { lastSessionId: latestSession.sessionId, lastSessionTitle: latestSession.title }),
        };
      }),
    );
  });
};
