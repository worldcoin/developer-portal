"use client";

import { WorldIcon } from "@/components/Icons/WorldIcon";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";

export const JoinCallbackPageContent = (props: { invite_id: string }) => {
  const router = useRouter();
  const { checkSession } = useUser();

  const joinUser = useCallback(async () => {
    let returnTo: string | null = null;

    try {
      const res = await fetch(urls.api.joinCallback(), {
        method: "POST",
        body: JSON.stringify({ invite_id: props.invite_id }),
      });

      await checkSession();
      const data = await res.json();

      if (!data.returnTo) {
        throw new Error("No returnTo found in response");
      }

      returnTo = data.returnTo;
    } catch (error) {
      toast.error("Failed to join team");

      setTimeout(() => {
        router.push(urls.login());
      }, 3000);
    }

    if (!returnTo) {
      return;
    }

    router.push(returnTo);
  }, [checkSession, props.invite_id, router]);

  useEffect(() => {
    joinUser();
  }, [joinUser]);

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center">
      <WorldIcon className="animate-ping" />
    </div>
  );
};
