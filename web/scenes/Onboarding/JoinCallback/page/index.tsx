import { logger } from "@/lib/logger";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";
import { JoinCallbackPageContent } from "./JoinCallbackPageContent";

export const JoinCallback = async (props: {
  searchParams: Promise<{ invite_id?: string }>;
}) => {
  const searchParams = await props.searchParams;
  const invite_id = searchParams?.invite_id;

  if (!invite_id) {
    logger.error("No invite_id found in searchParams after join", {
      searchParams,
    });

    return redirect(urls.logout());
  }

  return <JoinCallbackPageContent invite_id={invite_id} />;
};
