import { AuthRequired } from "common/AuthRequired";
import { Layout } from "common/Layout";
import { memo, useEffect } from "react";
import { Details } from "./Details";
import { Header } from "./Header";
import { MemberList } from "./MemberList";
import { getTeamStore, useTeamStore } from "./store";

export const Team = memo(function Team() {
  const { team, fetchTeam } = useTeamStore(getTeamStore);

  useEffect(() => {
    fetchTeam();
  }, []);

  return (
    <AuthRequired>
      <Layout>
        <Header />
        <Details />
        <MemberList />
      </Layout>
    </AuthRequired>
  );
});
