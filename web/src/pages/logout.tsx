import { AuthRequired } from "src/common/AuthRequired";
import { Spinner } from "src/common/Spinner";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { IAuthStore, useAuthStore } from "src/stores/authStore";

const getParam = (store: IAuthStore) => store.logout;

export default function Logout(): JSX.Element {
  const logout = useAuthStore(getParam);
  const router = useRouter();
  useEffect(() => {
    logout();
    setTimeout(() => (window.location.href = "/login"), 300);
  }, [logout]);
  return (
    <div className="flex h-screen w-full justify-center items-center">
      <Spinner />
    </div>
  );
}
