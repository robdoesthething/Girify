/**
 * Formats a username to ensure it starts with @ and is lowercase.
 * @param username The username to format
 * @returns formatted username string
 */
export const formatUsername = (username: string | undefined | null): string => {
  if (!username) {
    return '@unknown';
  }
  const clean = username.toLowerCase().trim();
  return clean.startsWith('@') ? clean : `@${clean}`;
};
