import { isSSR } from "common/helpers/is-ssr";
import useAuth from "hooks/useAuth";
import { useRouter } from "next/router";
import { Fragment, memo, ReactNode, useEffect } from "react";
import { IAuthStore, useAuthStore } from "stores/authStore";

const getParam = (store: IAuthStore) => store.redirectWithReturn;

export const AuthRequired = memo(function AuthRequired(props: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const redirectWithReturn = useAuthStore(getParam);

  useEffect(() => {
    if (!isSSR() && !isAuthenticated) {
      redirectWithReturn(router);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return <Fragment>{props.children}</Fragment>;
});
