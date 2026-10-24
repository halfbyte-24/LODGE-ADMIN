import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let initialized = false;

    // Safety timeout to prevent spinner from getting stuck on network/offline stalls
    const timeoutTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 5000);

    const initAuth = async () => {
      try {
        const sessionData = await authService.getCurrentUser();
        if (isMounted) {
          if (sessionData) {
            setUser(sessionData.user);
            setProfile(sessionData.profile);
          }
          initialized = true;
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'INITIAL_SESSION' && initialized) {
        return; // Avoid duplicate profile query
      }

      if (session) {
        setUser(session.user);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (error) console.error("Error fetching profile on state change:", error);
          if (isMounted) setProfile(data);
        } catch (err) {
          console.error("Profile fetch error:", err);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      }
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    setProfile(data.profile);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
