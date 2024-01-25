import { Layout } from "@/components/Layout";
import { memo, useMemo } from "react";
import { Details } from "./Details";
import { Header } from "./Header";
import { MemberList } from "./MemberList";
import { Preloader } from "@/components/Preloader";
import { useTeam } from "@/scenes/team/hooks/useTeam";
import useKeys from "src/hooks/useKeys";
import { KeyList } from "./KeyList";
import { useRouter } from "next/router";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { Role_Enum } from "@/graphql/graphql";

export const Team = memo(function Team() {
  const { data: team, loading } = useTeam();
  const { keys, isLoading } = useKeys();
  const router = useRouter();
  const { user } = useUser() as Auth0SessionUser;
  const team_id = useMemo(() => router.query.team_id as string, [router.query]);

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === team_id
    );

    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [team_id, user?.hasura.memberships]);

  return (
    <Layout mainClassName="grid gap-y-8">
      {loading && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!loading && !isLoading && team && (
        <div className="space-y-8">
          <Header />
          <Details team={team} />
          {team?.memberships && <MemberList members={team.memberships} />}
          {keys && isEnoughPermissions && <KeyList keys={keys} />}
        </div>
      )}
    </Layout>
  );
});
