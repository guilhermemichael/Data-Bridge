import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { clearAccessToken, getAccessToken, setAccessToken } from "../../services/auth-token";
import { getMe, login, register, type AuthUser, type LoginPayload, type RegisterPayload } from "./api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPassword: (payload: LoginPayload) => Promise<void>;
  registerAccount: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    clearAccessToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setUser(await getMe());
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const loginWithPassword = useCallback(async (payload: LoginPayload) => {
    const response = await login(payload);
    setAccessToken(response.access_token);
    setToken(response.access_token);
    setUser(await getMe());
  }, []);

  const registerAccount = useCallback(async (payload: RegisterPayload) => {
    const response = await register(payload);
    setAccessToken(response.access_token);
    setToken(response.access_token);
    setUser(await getMe());
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      loginWithPassword,
      registerAccount,
      logout,
      refreshUser,
    }),
    [
      user,
      token,
      isLoading,
      loginWithPassword,
      registerAccount,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
