import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export function useAuthToken(redirectOnUnauthenticated = false) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (err) {
        console.error('Failed to parse user data:', err);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && redirectOnUnauthenticated) {
      setLocation('/login');
    }
  }, [loading, user, redirectOnUnauthenticated, setLocation]);

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    setLocation('/login');
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}
