import { redirect } from "next/navigation";

// Danger controls now live on the consolidated action-detail page. From
// this subroute, "./" resolves to the parent action route.
export default function Page() {
  return redirect("./");
}
