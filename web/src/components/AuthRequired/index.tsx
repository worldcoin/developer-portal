import { isSSR } from "@/lib/utils";
import { useRouter } from "next/router";
import { Fragment, memo, ReactNode, useEffect, useLayoutEffect } from "react";
import { IAuthStore, useAuthStore } from "@/stores/authStore";

const getState = (state: IAuthStore) => ({
  isAuthCookiesValid: state.isAuthCookiesValid,
  setAuthCookies: state.setAuthCookies,
});

export const AuthRequired = memo(function AuthRequired(props: {
  children: ReactNode;
}) {
  const { isAuthCookiesValid, setAuthCookies } = useAuthStore(getState);
  const router = useRouter();

  useLayoutEffect(() => {
    if (!isSSR() && !isAuthCookiesValid()) {
      return setAuthCookies(null, router.asPath);
    }
  }, [isAuthCookiesValid, router, setAuthCookies]);

  return <Fragment>{props.children}</Fragment>;
});
