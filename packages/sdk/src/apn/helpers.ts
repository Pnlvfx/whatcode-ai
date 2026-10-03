const BODY_MAX = 178;

export const trim = (text: string) => (text.length <= BODY_MAX ? text : `${text.slice(0, BODY_MAX - 1)}…`);
