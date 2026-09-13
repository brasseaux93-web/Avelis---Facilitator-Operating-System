import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { setApiToken } from './apiClient';

export type FacilitatorInfo = {
  id: string;
  email: string;
  displayName: string;
  organizationId: string;
};

type FacilitatorAuthContextValue = {
  token: string | null;
  supabaseToken: string | null;
  facilitator: FacilitatorInfo | null;
  setSession: (token: string, supabaseToken: string, facilitator: FacilitatorInfo) => void;
  clearSession: () => void;
  isAuthenticated: boolean;
};

const FacilitatorAuthContext = createContext<FacilitatorAuthContextValue | undefined>(undefined);

/**
 * In-memory facilitator auth only. Never persist token to localStorage/sessionStorage.
 */
export function FacilitatorAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [supabaseToken, setSupabaseToken] = useState<string | null>(null);
  const [facilitator, setFacilitator] = useState<FacilitatorInfo | null>(null);

  const setSession = useCallback((nextToken: string, nextSupabaseToken: string, nextFacilitator: FacilitatorInfo) => {
    setToken(nextToken);
    setSupabaseToken(nextSupabaseToken);
    setFacilitator(nextFacilitator);
    setApiToken(nextToken);
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setSupabaseToken(null);
    setFacilitator(null);
    setApiToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      supabaseToken,
      facilitator,
      setSession,
      clearSession,
      isAuthenticated: !!token,
    }),
    [token, supabaseToken, facilitator, setSession, clearSession]
  );

  return (
    <FacilitatorAuthContext.Provider value={value}>{children}</FacilitatorAuthContext.Provider>
  );
}

export function useFacilitatorAuth() {
  const ctx = useContext(FacilitatorAuthContext);
  if (!ctx) {
    throw new Error('useFacilitatorAuth must be used within FacilitatorAuthProvider');
  }
  return ctx;
}
