export const gitError = <Status extends number>(status: Status, message: string) => ({ type: 'git' as const, status, message });
