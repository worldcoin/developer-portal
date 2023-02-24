import { isSSR } from "common/helpers/is-ssr";
import { useAuthContext } from "contexts/AuthContext";
import { Fragment, memo, ReactNode, useEffect, useMemo } from "react";
import { urls } from "urls";

export const AuthRequired = memo(function AuthRequired(props: {
  children: ReactNode;
}) {
  const { token, redirectWithReturn } = useAuthContext();
  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  if (!isSSR() && !isAuthenticated) {
    redirectWithReturn(urls.onboarding());
  }

  return <Fragment>{props.children}</Fragment>;
});
