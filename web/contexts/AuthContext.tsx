import { decodeJwt, JWTPayload } from "jose";
import { useRouter } from "next/router";

import {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { urls } from "urls";

type AuthContextValue = {
  token: string | null;
  logout: () => void;
  setToken: (token: string) => void;
  redirectWithReturn: (path: string) => void;
  enterApp: () => void;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  logout: () => {},
  setToken: () => {},
  redirectWithReturn: () => {},
  enterApp: () => {},
  isAuthenticated: false,
});

export const AuthProvider = memo(function AuthProvider(props: {
  children: ReactNode;
  token: string | null;
}) {
  const router = useRouter();
  const [token, updateToken] = useState<string | null>(props.token);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    updateToken(null);
  }, []);

  const setToken = useCallback((token: string) => {
    updateToken(token);
    localStorage.setItem("token", token);
  }, []);

  const redirectWithReturn = useCallback(
    (path: string) => {
      localStorage.setItem("returnTo", router.asPath);
      router.push(path);
    },
    [router]
  );

  const enterApp = useCallback(() => {
    const returnTo = localStorage.getItem("returnTo");

    if (!returnTo) {
      router.push(urls.app());
      return;
    }

    router.push(returnTo);
    localStorage.removeItem("returnTo");
  }, [router]);

  const isAuthenticated = useMemo(() => !!token, [token]);

  const value = useMemo(
    () => ({
      token,
      setToken,
      logout,
      redirectWithReturn,
      enterApp,
      isAuthenticated,
    }),
    [logout, redirectWithReturn, enterApp, setToken, token, isAuthenticated]
  );

  useEffect(() => {
    if (!token) {
      const candidateToken = localStorage.getItem("token");
      let decodedToken: JWTPayload | undefined;
      if (candidateToken) {
        try {
          decodedToken = decodeJwt(candidateToken);
        } catch (e) {
          console.warn(`Error decoding stored token.`, e);
        }
        if (
          decodedToken &&
          new Date().getTime() / 1000 < (decodedToken.exp ?? 0)
        ) {
          setToken(localStorage.getItem("token") as string);
        } else {
          logout();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
});

export const useAuthContext = () => useContext(AuthContext);
