/**
 * User entity (matches backend User type)
 */
export interface User {
  id: string;
  githubId: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

/**
 * Auth status response
 */
export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}
