'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial auth check
  useEffect(() => {
    async function init() {
      try {
        // Check if system needs setup
        const setupRes = await fetch('/api/auth/setup-check');
        const { needsSetup } = await setupRes.json();

        if (needsSetup && !window.location.pathname.startsWith('/setup')) {
          window.location.href = '/setup';
          return;
        }

        // Check current session
        const meRes = await fetch('/api/auth/me');
        const { user: currentUser } = await meRes.json();

        if (currentUser) {
          setUser(currentUser);
        } else {
          // No session, redirect to login (unless already on public page)
          const publicPaths = ['/login', '/signup', '/setup'];
          if (!publicPaths.some(p => window.location.pathname.startsWith(p))) {
            window.location.href = '/login';
            return;
          }
        }
      } catch {
        // Network error - don't redirect
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Login failed' };
    }

    setUser(data.user);
    window.location.href = '/';
    return { success: true };
  }, []);

  const signup = useCallback(async (username, password) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.error || 'Signup failed' };
    }

    window.location.href = '/login?registered=true';
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export default AuthContext;
