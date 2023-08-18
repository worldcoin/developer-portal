import { ComponentType, FC, useEffect } from "react";
import { IUserStore, useUserStore } from "@/stores/userStore";

const getUserStore = (store: IUserStore) => ({
  setUserId: store.setUserId,
});

interface WithUserIdProps {
  user_id?: string;
}

export function withUserId<P extends object>(
  Component: ComponentType<P>
): FC<P & WithUserIdProps> {
  return function WrappedComponent({ user_id, ...props }) {
    const { setUserId } = useUserStore(getUserStore);

    useEffect(() => {
      setUserId(user_id);
    }, [user_id, setUserId]);

    return <Component {...(props as P)} />;
  };
}
