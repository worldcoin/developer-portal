import { useAuthContext } from "contexts/AuthContext";
import { useRouter } from "next/router";
import { Fragment, memo, ReactNode, useEffect, useMemo } from "react";

export const AuthRequired = memo(function AuthRequired(props: {
  children: ReactNode;
}) {
  const { token, redirectWithReturn } = useAuthContext();
  const isAuthenticated = useMemo(() => Boolean(token), [token]);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      redirectWithReturn("/login");
    }
  }, [redirectWithReturn, router, token]);

  if (isAuthenticated) {
    return <Fragment>{props.children}</Fragment>;
  }

  //TODO: make a preloader
  return <div>Loading...</div>;
});
