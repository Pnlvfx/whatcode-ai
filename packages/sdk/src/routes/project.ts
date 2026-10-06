import type { WhatCodeClient } from '../opencode/client.ts';
import { Elysia } from 'elysia';
import { getLastMessageTimeByProject, getLatestSessionByProject } from '../opencode/db.ts';

export const createProjectRouterOverride = (client: WhatCodeClient) => {
  return new Elysia({ prefix: '/api/project' }).get('/api/project', async ({ status }) => {
    const projects = await client.project.list();
    if (projects.error) return status(400, { message: projects.error.message });
    const lastMessageTimes = getLastMessageTimeByProject();
    const latestSessions = getLatestSessionByProject();
    return projects.data.map((project) => {
      const lastMsg = lastMessageTimes.get(project.id);
      const latestSession = latestSessions.get(project.id);
      return {
        ...project,
        ...(lastMsg !== undefined && { time: { ...project.time, updated: lastMsg } }),
        ...(latestSession !== undefined && { lastSessionId: latestSession.sessionId, lastSessionTitle: latestSession.title }),
      };
    });
  });
};
