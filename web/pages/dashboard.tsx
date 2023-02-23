import { AuthRequired } from "common/AuthRequired";
import { useAuthContext } from "contexts/AuthContext";

const Dashboard = () => {
  const { logout } = useAuthContext();

  return (
    <AuthRequired>
      <div className="grid justify-start">
        <span>Dashboard</span>
        <button
          type="button"
          className="border bg-primary hover:bg-primary/50 text-ffffff"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </AuthRequired>
  );
};

export default Dashboard;
