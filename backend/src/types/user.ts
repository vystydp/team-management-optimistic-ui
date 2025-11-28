/**
 * User entity representing an authenticated user
 */
export interface User {
  id: string;
  githubId: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GitHub profile data from OAuth
 */
export interface GitHubProfile {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}
