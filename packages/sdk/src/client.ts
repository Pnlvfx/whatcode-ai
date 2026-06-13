import type { ApiSpec } from '@/server/server';
import { createApiClient } from '@coraline/client';
import { SERVER_URL } from './config/constants.ts';
import { apiSpec } from './__spec/__api-spec.ts';

export const apiClient = createApiClient<ApiSpec>(apiSpec, { serverUrl: SERVER_URL });
