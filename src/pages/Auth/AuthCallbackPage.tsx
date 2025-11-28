import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';

export function AuthCallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const error = params.get('error');

        if (error) {
          console.error('[AuthCallback] OAuth error:', error);
          navigate('/login?error=' + error);
          return;
        }

        if (!token) {
          console.error('[AuthCallback] No token in callback URL');
          navigate('/login?error=no_token');
          return;
        }

        // Store token
        authService.setToken(token);

        // Load user data
        await checkAuth();

        // Redirect to home
        navigate('/', { replace: true });
      } catch (error) {
        console.error('[AuthCallback] Callback error:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [navigate, checkAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-porsche-gray-100 to-porsche-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-porsche-lg shadow-porsche-xl max-w-md w-full p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-porsche-gray-900 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-porsche-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-porsche-gray-600">
          Please wait while we authenticate you.
        </p>
      </div>
    </div>
  );
}
