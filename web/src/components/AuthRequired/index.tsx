import { useRouter } from "next/router";
import { Fragment, memo, ReactNode, useEffect } from "react";
import { isSSR } from "src/lib/utils";
import { IAuthStore, useAuthStore } from "src/stores/authStore";

const getParams = (store: IAuthStore) => ({
  redirectWithReturn: store.redirectWithReturn,
  token: store.token,
});

export const AuthRequired = memo(function AuthRequired(props: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { redirectWithReturn, token } = useAuthStore(getParams);

  useEffect(() => {
    if (!isSSR() && !token) {
      redirectWithReturn(router);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return <Fragment>{props.children}</Fragment>;
});
