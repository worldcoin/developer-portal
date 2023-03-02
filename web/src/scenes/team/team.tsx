import { AuthRequired } from "@/components/AuthRequired";
import { Layout } from "@/components/Layout";
import { memo, useEffect } from "react";
import { Details } from "./Details";
import { Header } from "./Header";
import { MemberList } from "./MemberList";
import { getTeamStore, useTeamStore } from "@/stores/teamStore";

export const Team = memo(function Team() {
  const { team, fetchTeam } = useTeamStore(getTeamStore);

  useEffect(() => {
    fetchTeam();
  }, []);

  return (
    <AuthRequired>
      <Layout mainClassName="grid gap-y-8">
        <Header />
        <Details />
        <MemberList />
      </Layout>
    </AuthRequired>
  );
});
