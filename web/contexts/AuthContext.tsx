import { deleteCookie, setCookie } from "cookies-next";
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

type AuthContextValue = {
  token?: string;
  logout: () => void;
  setToken: (token: string) => void;
  redirectWithReturn: (path: string) => void;
  enterApp: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  logout: () => {},
  setToken: () => {},
  redirectWithReturn: () => {},
  enterApp: () => {},
});

export const AuthProvider = memo(function AuthProvider(props: {
  children: ReactNode;
  token?: string;
}) {
  const router = useRouter();
  const [token, updateToken] = useState<string | undefined>(props.token);

  const logout = useCallback(() => {
    deleteCookie("token");
    updateToken(undefined);
  }, []);

  const setToken = useCallback((token: string) => {
    setCookie("token", token);
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
      router.push("/dashboard");
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
