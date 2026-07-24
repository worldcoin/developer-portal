"use client";

import { Button } from "@/components/Button";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Auth0SessionUser } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useMemo, useState } from "react";

type Props = {
  href?: string;
};

// Only rendered when the user has a team to return to — closing with no teams used to strand users on the logged-out landing page.
export const CloseButton = (props: Props) => {
  const { user, isLoading } = useUser();
  const auth0User = (user ?? undefined) as Auth0SessionUser["user"];
  const router = useRouter();

  const hasTeams = useMemo(
    () => (auth0User?.hasura?.memberships?.length ?? 0) > 0,
    [auth0User?.hasura?.memberships],
  );

  // Latch hidden once the session resolves to no teams: the post-create session refresh lands before navigation finishes and would otherwise flash the X back in. A failed profile fetch also reports `isLoading: false`, so latch only on a session we actually read.
  const [sawNoTeams, setSawNoTeams] = useState(false);
  if (!isLoading && auth0User && !hasTeams && !sawNoTeams) {
    setSawNoTeams(true);
  }

  const closeCreateTeam = useCallback(() => {
    if (props.href) {
      return router.push(props.href);
    }

    return router.back();
  }, [router, props.href]);

  if (sawNoTeams || !hasTeams) {
    return null;
  }

  return (
    <Fragment>
      <Button type="button" onClick={closeCreateTeam} className="flex">
        <CloseIcon />
      </Button>

      <span className="text-grey-200">|</span>
    </Fragment>
  );
};
