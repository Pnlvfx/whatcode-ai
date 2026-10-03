import { ClientError, OpenCode, type MessageListInput, type ModelListInput, type SessionGetInput } from '@opencode/client';
import { Service, type Endpoint } from '@opencode/client/service';
import { safeTryCatch } from '../compiled/core/try-catch.ts';

// without this ts fire some errors duo to type portability
export type RequestOptions = OpenCode.RequestOptions;

export const createWhatCodeClient = (endpoint: Endpoint) => {
  const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });

  return {
    server: {
      info: (options: RequestOptions = {}) => {
        return request2(client.server.info(options));
      },
    },
    event: {
      subscribe: () => client.event.subscribe(),
    },
    project: {
      list: (options: RequestOptions = {}) => {
        return request2(client.project.list(options));
      },
    },
    session: {
      get: (input: SessionGetInput) => {
        return request2(client.session.get(input));
      },
    },
    message: {
      list: (input: MessageListInput) => {
        return request2(client.message.list(input));
      },
    },
    model: {
      list: (input?: ModelListInput) => {
        return request2(client.model.list(input));
      },
    },
  };
};

const request2 = <T>(promise: Promise<T>) => safeTryCatch<T, ClientError>(promise);

export type WhatCodeClient = ReturnType<typeof createWhatCodeClient>;
