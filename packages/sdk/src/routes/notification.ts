import { Elysia } from 'elysia';
import * as z from 'zod/v4/mini';
import { getNotificationState, markSessionSeen } from '../stores/notification-state.ts';

export const notificationRouter = new Elysia({ prefix: '/notification' })
  .get('/count', async ({ status }) => {
    const result = await getNotificationState();
    if (result.error) return status(500, { message: result.error.message });

    const sessions = Object.values(result.data);
    const unreadProjectIDs = new Set<string>();
    let totalUnreadSessions = 0;

    for (const s of sessions) {
      if (!(s.unseenCount > 0 || s.hasPendingPermission)) continue;

      unreadProjectIDs.add(s.projectID);
      totalUnreadSessions++;
    }

    return { totalUnreadSessions, unreadProjects: unreadProjectIDs.size };
  })
  .get('/unread-projects', async ({ status }) => {
    const result = await getNotificationState();
    if (result.error) return status(500, { message: result.error.message });

    const unreadProjectIDs = new Set<string>();

    for (const s of Object.values(result.data)) {
      if (s.unseenCount > 0 || s.hasPendingPermission) {
        unreadProjectIDs.add(s.projectID);
      }
    }

    return [...unreadProjectIDs];
  })
  .get('/project/:projectID', async ({ params: { projectID }, status }) => {
    const result = await getNotificationState();
    return result.error ? status(500, { message: result.error.message }) : Object.values(result.data).filter((s) => s.projectID === projectID);
  })
  .get('/session/:sessionID', async ({ params: { sessionID }, status }) => {
    const result = await getNotificationState();
    if (result.error) return status(500, { message: result.error.message });

    const session = result.data[sessionID];
    return session ?? status(404, { message: 'Session not found' });
  })
  .post(
    '/viewed',
    async ({ body: { sessionID }, status }) => {
      const result = await markSessionSeen(sessionID);
      return result.error ? status(500, { message: result.error }) : { status: 'success' };
    },
    { body: z.strictObject({ sessionID: z.string() }) },
  );
