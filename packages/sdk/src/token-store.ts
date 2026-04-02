interface TokenEntry {
  userId: string;
  token: string;
}

let entry: TokenEntry | undefined;

// TODO store the token

export const setToken = (userId: string, token: string): void => {
  entry = { userId, token };
};

export const getToken = (): TokenEntry | undefined => entry;
