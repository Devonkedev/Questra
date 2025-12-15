import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChange, getCurrentUserData } from '../lib/auth.js';
import { getAuthInstance } from '../lib/firebase';

interface AuthGateProps {
  children: ReactNode;
  redirectTo?: string;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export default function AuthGate({ children, redirectTo = '/login' }: AuthGateProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    // Firebase Auth automatically persists sessions, so we can check synchronously
    (async () => {
      try {
        const auth = await getAuthInstance();
        // Firebase automatically restores sessions, so currentUser should be available immediately
        if (auth?.currentUser) {
          if (!isMounted) return;
          setStatus('authenticated');
        } else {
          // Set up listener for auth state changes
          unsubscribe = await onAuthStateChange((user) => {
            if (!isMounted) return;
            setStatus(user ? 'authenticated' : 'unauthenticated');
          });
        }
      } catch (err) {
        console.error('AuthGate: Failed to check auth', err);
        if (!isMounted) return;
        setError('Unable to verify your session. Please refresh and try again.');
        setStatus('unauthenticated');
      }
    })();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' && typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      const params = new URLSearchParams({ redirect: currentPath });
      window.location.href = `${redirectTo}?${params.toString()}`;
    }
  }, [status, redirectTo]);

  if (status === 'loading') {
    return (
      <div className="py-16 text-center text-gray-600">
        Checking your session...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="py-16 text-center text-gray-600">
        Redirecting to login...
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return <>{children}</>;
}
