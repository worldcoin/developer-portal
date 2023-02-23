import { useRouter } from "next/router";

import {
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
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
};

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  logout: () => {},
  setToken: () => {},
  redirectWithReturn: () => {},
  enterApp: () => {},
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
    localStorage.setItem("token", token);
    updateToken(token);
  }, []);

  const redirectWithReturn = useCallback(
    (path: string) => {
      console.log(router.asPath);
      sessionStorage.setItem("returnTo", router.asPath);
      router.push(path);
    },
    [router]
  );

  const enterApp = useCallback(() => {
    const returnTo = sessionStorage.getItem("returnTo");

    if (!returnTo) {
      router.push(urls.dashboard());
      return;
    }

    router.push(returnTo);
    sessionStorage.removeItem("returnTo");
  }, [router]);

  const value = useMemo(
    () => ({
      token,
      setToken,
      logout,
      redirectWithReturn,
      enterApp,
    }),
    [logout, redirectWithReturn, enterApp, setToken, token]
  );

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
});

export const useAuthContext = () => useContext(AuthContext);
