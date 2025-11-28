import { User, GitHubProfile } from '../types/user';

/**
 * Simple in-memory user storage for MVP
 * TODO: Replace with database in Phase 5
 */
class UserService {
  private users: Map<string, User> = new Map();
  private usersByGitHubId: Map<string, User> = new Map();

  /**
   * Find user by internal ID
   */
  findById(id: string): User | null {
    return this.users.get(id) || null;
  }

  /**
   * Find user by GitHub ID
   */
  findByGitHubId(githubId: string): User | null {
    return this.usersByGitHubId.get(githubId) || null;
  }

  /**
   * Create or update user from GitHub profile
   */
  createOrUpdate(profile: GitHubProfile): User {
    const existingUser = this.findByGitHubId(profile.id);
    const now = new Date();

    if (existingUser) {
      // Update existing user
      existingUser.login = profile.login;
      existingUser.name = profile.name;
      existingUser.email = profile.email;
      existingUser.avatarUrl = profile.avatar_url;
      existingUser.updatedAt = now;
      return existingUser;
    }

    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      githubId: profile.id,
      login: profile.login,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(newUser.id, newUser);
    this.usersByGitHubId.set(newUser.githubId, newUser);

    console.log(`[UserService] Created new user: ${newUser.login} (${newUser.id})`);
    return newUser;
  }

  /**
   * Get all users (for debugging)
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

export const userService = new UserService();
