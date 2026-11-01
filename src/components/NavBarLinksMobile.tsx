import { useEffect, useState } from 'react';
import { getAuthInstance } from '../lib/firebase';
import { onAuthStateChange } from '../lib/auth';

export default function NavBarLinksMobile() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Single effect to check auth - Firebase handles persistence automatically
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        // Check current user immediately (Firebase restores sessions automatically)
        const auth = await getAuthInstance();
        if (auth?.currentUser && isMounted) {
          setIsLoggedIn(true);
          setLoading(false);
        }
        
        // Set up listener for auth state changes
        unsubscribe = await onAuthStateChange((user: any) => {
          if (!isMounted) return;
          setIsLoggedIn(!!user);
          setLoading(false);
        });
      } catch (err) {
        console.error('NavBarLinksMobile: Failed to check auth', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  // Show only Home for logged-out users
  if (!loading && !isLoggedIn) {
    return (
      <a href="/" className="block py-2 hover:text-[#5EEAD4] transition-colors">Home</a>
    );
  }

  // Show all links for logged-in users
  if (!loading && isLoggedIn) {
    return (
      <>
        <a href="/" className="block py-2 hover:text-[#5EEAD4] transition-colors">Home</a>
        <a href="/notes" className="block py-2 hover:text-[#5EEAD4] transition-colors">Notes</a>
        <a href="/doubts" className="block py-2 hover:text-[#5EEAD4] transition-colors">Doubts</a>
        <a href="/ask" className="block py-2 hover:text-[#5EEAD4] transition-colors">Ask a Doubt</a>
      </>
    );
  }

  // Loading state - show minimal
  return (
    <a href="/" className="block py-2 hover:text-[#5EEAD4] transition-colors">Home</a>
  );
}

