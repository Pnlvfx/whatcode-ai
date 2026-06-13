export const apiSpec = {
  robots: { method: 'get', path: '/robots.txt' },
  versionControl: { method: 'get', path: '/version' },
  pushV2: { method: 'post', path: '/relay/push/v2' },
  getFeatureFlags: { method: 'get', path: '/feature-flags' },
  reviewIdentity: { method: 'get', path: '/review/whatcode/identity' },
  sendLog: { method: 'post', path: '/logger/logs' },
  deprecatedSendLog: { method: 'post', path: '/logger/log' },
  register: { method: 'post', path: '/users/register' },
  renameAccount: { method: 'patch', path: '/users/rename-account' },
  logout: { method: 'post', path: '/users/logout' },
} as const;
