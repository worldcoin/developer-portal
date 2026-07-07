import { requireAdminUser } from "@/lib/admin-auth";

export const AdminPage = async () => {
  const user = await requireAdminUser();

  return (
    <div className="grid h-full place-items-center">
      <div className="text-center">
        <h1 className="text-lg font-medium">Internal dashboard</h1>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
    </div>
  );
};
