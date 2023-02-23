import { isSSR } from "common/helpers/is-ssr";
import { useAuthContext } from "contexts/AuthContext";
import { useRouter } from "next/router";
import { Fragment, memo, ReactNode, useEffect, useMemo } from "react";

export const AuthRequired = memo(function AuthRequired(props: {
  children: ReactNode;
}) {
  const { token, redirectWithReturn } = useAuthContext();
  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  if (!isSSR() && !isAuthenticated) {
    redirectWithReturn("/login");
  }

  return <Fragment>{props.children}</Fragment>;
});
