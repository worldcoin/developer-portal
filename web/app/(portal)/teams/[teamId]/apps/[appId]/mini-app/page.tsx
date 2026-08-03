import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { redirect } from "next/navigation";

export default function MiniAppPage() {
  return pickPortalVersion(
    () => redirect("./mini-app/develop"),
    () => redirect("./mini-app/permissions"),
  );
}
