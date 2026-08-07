"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  fetchCurrentProfile,
  signInWithGoogle,
  signOut,
  subscribeToAuth,
} from "@/services/auth.service";

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((profile) => {
      setUser(profile);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    const profile = await fetchCurrentProfile();
    if (profile) setUser(profile);
  }, []);

  const value = {
    user,
    loading,
    signIn: signInWithGoogle,
    signOut,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
