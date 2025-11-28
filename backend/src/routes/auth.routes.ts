import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { requireAuth } from '../middleware/auth.middleware';
import { GitHubProfile } from '../types/user';

const router = Router();

// Extend session data with OAuth state
declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
  }
}

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Configure GitHub OAuth strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_CALLBACK_URL,
    },
    (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: Error | null, user?: Express.User | false) => void
    ) => {
      try {
        // Extract relevant profile data
        const githubProfile: GitHubProfile = {
          id: profile.id,
          login: profile.username || 'unknown',
          name: profile.displayName || null,
          email: profile.emails?.[0]?.value || null,
          avatar_url: profile.photos?.[0]?.value || null,
        };

        // Create or update user
        const user = userService.createOrUpdate(githubProfile);
        
        console.log(`[Auth] GitHub login successful for ${user.login}`);
        done(null, user);
      } catch (error) {
        console.error('[Auth] GitHub strategy error:', error);
        done(error instanceof Error ? error : new Error('Authentication failed'), false);
      }
    }
  )
);

// Serialize user to session (not used with JWT, but required by Passport)
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

passport.deserializeUser((id: string, done) => {
  const user = userService.findById(id);
  done(null, user || false);
});

/**
 * GET /auth/login
 * Initiates GitHub OAuth flow
 */
router.get('/login', (req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    res.status(500).json({
      error: 'Configuration error',
      message: 'GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.',
    });
    return;
  }

  // Generate CSRF state token
  const state = Buffer.from(JSON.stringify({
    timestamp: Date.now(),
    nonce: Math.random().toString(36)
  })).toString('base64');
  
  // Store state in session for validation
  if (req.session) {
    req.session.oauthState = state;
  }

  // Redirect to GitHub OAuth with state parameter
  passport.authenticate('github', { 
    scope: ['user:email'],
    session: false,
    state: state
  })(req, res);
});

/**
 * GET /auth/callback
 * Handles GitHub OAuth callback
 */
router.get(
  '/callback',
  passport.authenticate('github', { 
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=auth_failed`
  }),
  (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.redirect(`${FRONTEND_URL}/login?error=no_user`);
        return;
      }

      // Generate JWT token
      const user = req.user as import('../types/user').User;
      const token = authService.generateToken(user);

      // Send token to popup opener and close popup
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            .checkmark {
              font-size: 4rem;
              margin-bottom: 1rem;
              animation: scale 0.5s ease-in-out;
            }
            @keyframes scale {
              0% { transform: scale(0); }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="checkmark">✓</div>
            <h1>Authentication Successful!</h1>
            <p>This window will close automatically...</p>
          </div>
          <script>
            // Send token to parent window
            if (window.opener) {
              const message = {
                type: 'oauth-success',
                token: '${token}'
              };
              
              // Send message to frontend origin (parent window)
              const frontendOrigin = '${FRONTEND_URL}';
              console.log('[OAuth Popup] Sending message to parent:', frontendOrigin);
              
              // Send message immediately
              window.opener.postMessage(message, frontendOrigin);
              
              // Send again after a short delay to ensure delivery
              setTimeout(() => {
                window.opener.postMessage(message, frontendOrigin);
                console.log('[OAuth Popup] Sent second message');
              }, 100);
              
              // Close window after longer delay
              setTimeout(() => {
                console.log('[OAuth Popup] Closing window');
                window.close();
              }, 2000);
            } else {
              // Fallback: redirect if not opened as popup
              window.location.href = '${FRONTEND_URL}/auth/callback?token=${token}';
            }
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('[Auth] Callback error:', error);
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Authentication Failed</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth-error',
                error: 'token_generation_failed'
              }, window.location.origin);
              window.close();
            } else {
              window.location.href = '${FRONTEND_URL}/login?error=token_generation_failed';
            }
          </script>
        </body>
        </html>
      `);
    }
  }
);

/**
 * GET /auth/me
 * Returns current authenticated user
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  // User is attached to request by requireAuth middleware
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Return user without sensitive data
  const user = req.user as import('../types/user').User;
  const { id, githubId, login, name, email, avatarUrl } = user;
  res.json({
    id,
    githubId,
    login,
    name,
    email,
    avatarUrl,
  });
});

/**
 * POST /auth/logout
 * Clears user session (client should delete token)
 */
router.post('/logout', (req: Request, res: Response) => {
  // With JWT, logout is handled client-side by deleting the token
  // This endpoint exists for consistency and potential future session management
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /auth/status
 * Check if user is authenticated (doesn't require auth)
 */
router.get('/status', (req: Request, res: Response) => {
  const token = authService.extractTokenFromHeader(req.headers.authorization);
  
  if (!token) {
    res.json({ authenticated: false });
    return;
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    res.json({ authenticated: false });
    return;
  }

  const user = userService.findById(payload.userId);
  if (!user) {
    res.json({ authenticated: false });
    return;
  }

  res.json({ 
    authenticated: true,
    user: {
      id: user.id,
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
    }
  });
});

export default router;
