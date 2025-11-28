import { useEffect, useState } from 'react';
import { Button } from 'react-aria-components';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';

export function LoginPage(): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);

  useEffect(() => {
    // Check if there's an error in URL params
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    
    if (urlError) {
      setError('Authentication failed. Please try again.');
      console.error('[Login] Auth error:', urlError);
    }
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.login();
      
      // Fetch user data after successful login
      const user = await authService.getCurrentUser();
      if (user) {
        setUser(user);
        navigate('/');
      }
    } catch (err) {
      console.error('[Login] Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-porsche-neutral-800 via-porsche-neutral-700 to-porsche-neutral-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-porsche-lg shadow-porsche-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-porsche-neutral-900 mb-2">
            Team Management
          </h1>
          <p className="text-porsche-neutral-600">
            Sign in to manage your teams and environments
          </p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-porsche-md text-sm">
              {error}
            </div>
          )}

          <Button
            onPress={handleLogin}
            isDisabled={isLoading}
            className="w-full bg-porsche-neutral-900 text-white py-3 px-4 rounded-porsche-md hover:bg-porsche-neutral-800 active:bg-porsche-black transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Opening GitHub...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Sign in with GitHub
              </>
            )}
          </Button>

          <p className="text-sm text-porsche-neutral-500 text-center">
            By signing in, you agree to use this application for team management purposes.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-porsche-neutral-200">
          <p className="text-xs text-porsche-neutral-500 text-center">
            This app uses GitHub OAuth for authentication. Your GitHub credentials are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
