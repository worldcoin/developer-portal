import { AuthRequired } from "common/AuthRequired";
import { useAuthContext } from "contexts/AuthContext";
import { useEffect } from "react";

export default function Logout(): JSX.Element {
  const { logout } = useAuthContext();
  useEffect(() => logout(), [logout]);
  return (
    <AuthRequired>
      <div>Logging out...</div>
    </AuthRequired>
  );
}
