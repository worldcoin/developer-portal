import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";

export const JoinCallback = async (props: {
  searchParams: Promise<{ invite_id?: string }>;
}) => {
  const searchParams = await props.searchParams;
  const invite_id = searchParams?.invite_id;

  if (!invite_id) {
    return redirect("/404");
  }

  return redirect(urls.join({ invite_id }));
};
