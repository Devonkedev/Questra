import { useEffect, useState } from 'react';
import { onAuthStateChange } from '../lib/auth';

export default function HomeRedirect() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        unsubscribe = await onAuthStateChange((user) => {
          if (!isMounted) return;
          if (user) {
            // User is logged in, redirect to app
            window.location.href = '/app';
          } else {
            // User is not logged in, show home page
            setChecking(false);
          }
        });
      } catch (err) {
        console.error('HomeRedirect: Failed to check auth', err);
        if (!isMounted) return;
        setChecking(false);
      }
    })();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  if (checking) {
    return (
      <div className="py-16 text-center text-gray-600">
        Loading...
      </div>
    );
  }

  return null; // Home page content will show
}

