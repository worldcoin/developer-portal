import { AuthRequired } from "common/AuthRequired";
import { useAuthContext } from "contexts/AuthContext";

const Dashboard = () => {
  const { logout } = useAuthContext();

  return (
    <AuthRequired>
      <div>Dashboard</div>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </AuthRequired>
  );
};

export default Dashboard;
