import { requireAdminUser } from "@/lib/admin-auth";
import { AdminPage } from "@/scenes/Admin/page";

export default async function Page() {
  await requireAdminUser();

  return <AdminPage />;
}
