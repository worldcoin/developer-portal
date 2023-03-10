import { Layout } from "@/components/Layout";
import { memo, useEffect } from "react";
import { Details } from "./Details";
import { Header } from "./Header";
import { MemberList } from "./MemberList";
import { getTeamStore, useTeamStore } from "@/stores/teamStore";

export const Team = memo(function Team(props: { user_id?: string }) {
  const { team, fetchTeam } = useTeamStore(getTeamStore);

  useEffect(() => {
    fetchTeam();
  }, []);

  return (
    <Layout userId={props.user_id} mainClassName="grid gap-y-8">
      <Header />
      <Details />
      <MemberList />
    </Layout>
  );
});
