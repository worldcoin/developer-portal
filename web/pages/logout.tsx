import { AuthRequired } from "common/AuthRequired";
import { Spinner } from "common/Spinner";
import { useEffect } from "react";
import { IAuthStore, useAuthStore } from "stores/authStore";

const getParam = (store: IAuthStore) => store.logout;

export default function Logout(): JSX.Element {
  const logout = useAuthStore(getParam);
  useEffect(() => logout(), [logout]);
  return (
    <AuthRequired>
      <div className="flex h-screen w-full justify-center items-center">
        <Spinner />
      </div>
    </AuthRequired>
  );
}
