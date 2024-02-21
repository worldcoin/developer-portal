"use client";

import { Button } from "@/components/Button";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useMemo } from "react";

export const CloseButton = () => {
  const { user } = useUser() as Auth0SessionUser;
  const router = useRouter();
  const hasUser = useMemo(() => Boolean(user?.hasura?.id), [user?.hasura?.id]);

  const closeCreateTeam = useCallback(() => {
    if (!hasUser) {
      return router.push(urls.logout());
    }

    return router.back();
  }, [hasUser, router]);

  return (
    <Fragment>
      {hasUser && (
        <Button type="button" onClick={closeCreateTeam} className="flex">
          <CloseIcon />
        </Button>
      )}

      {!hasUser && (
        <Button href={urls.logout()} className="flex">
          <CloseIcon />
        </Button>
      )}
    </Fragment>
  );
};
