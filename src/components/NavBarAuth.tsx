import { useEffect, useState } from 'react';
import { onAuthStateChange, signOutUser } from '../lib/auth';
import { getAuthInstance } from '../lib/firebase';

export default function NavBarAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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
        unsubscribe = await onAuthStateChange((user) => {
          if (!isMounted) return;
          setIsLoggedIn(!!user);
          setLoading(false);
        });
      } catch (err) {
        console.error('NavBarAuth: Failed to check auth', err);
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

  const handleLogout = async () => {
    try {
      await signOutUser();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <a href="/login" className="bg-gradient-to-r from-[#2DD4BF] to-[#5EEAD4] text-[#1E1B4B] px-4 py-2 rounded-lg font-semibold hover:from-[#14B8A6] hover:to-[#2DD4BF] transition-all shadow-md hover:shadow-lg transform hover:scale-105">
        Login
      </a>
    );
  }

  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        className="bg-gradient-to-r from-[#2DD4BF] to-[#5EEAD4] text-[#1E1B4B] px-4 py-2 rounded-lg font-semibold hover:from-[#14B8A6] hover:to-[#2DD4BF] transition-all shadow-md hover:shadow-lg transform hover:scale-105"
      >
        Logout
      </button>
    );
  }

  return (
    <a href="/login" className="bg-gradient-to-r from-[#2DD4BF] to-[#5EEAD4] text-[#1E1B4B] px-4 py-2 rounded-lg font-semibold hover:from-[#14B8A6] hover:to-[#2DD4BF] transition-all shadow-md hover:shadow-lg transform hover:scale-105">
      Login
    </a>
  );
}

