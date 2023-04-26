import { Layout } from "@/components/Layout";
import { memo } from "react";
import { Details } from "./Details";
import { Header } from "./Header";
import { MemberList } from "./MemberList";
import { Preloader } from "@/components/Preloader";
import { useTeam } from "@/scenes/team/hooks/useTeam";
import useKeys from "src/hooks/useKeys";
import { KeyList } from "./KeyList";

export const Team = memo(function Team(props: { user_id?: string }) {
  const { data: team, loading } = useTeam();
  const { keys, isLoading } = useKeys();

  return (
    <Layout userId={props.user_id} mainClassName="grid gap-y-8">
      {loading && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}
      {!loading && !isLoading && team && (
        <div className="space-y-8">
          <Header />
          <Details team={team} />
          {team.members && <MemberList members={team.members} />}
          {keys && <KeyList keys={keys} />}
        </div>
      )}
    </Layout>
  );
});
