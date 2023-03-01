import { isSSR } from "common/helpers/is-ssr";
import { useAuthContext } from "contexts/AuthContext";
import { Fragment, memo, ReactNode, useEffect } from "react";
import { urls } from "urls";

export const AuthRequired = memo(function AuthRequired(props: {
  children: ReactNode;
}) {
  const { isAuthenticated, redirectWithReturn } = useAuthContext();

  useEffect(() => {
    if (!isSSR() && !isAuthenticated) {
      redirectWithReturn(urls.login());
    }
  }, [isAuthenticated, redirectWithReturn]);

  return <Fragment>{props.children}</Fragment>;
});
