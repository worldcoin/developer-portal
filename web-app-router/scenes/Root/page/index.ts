import { redirect } from "next/navigation";

export const RootPage = () => {
  return redirect("/login");
};
