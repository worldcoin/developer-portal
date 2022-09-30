import { useActions } from "kea";
import { authLogic } from "logics/authLogic";
import { useEffect } from "react";

export default function Logout(): JSX.Element {
  const { logout } = useActions(authLogic);
  useEffect(() => logout(), [logout]);
  return <></>;
}
