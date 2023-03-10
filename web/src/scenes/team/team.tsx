import { AuthRequired } from "@/components/AuthRequired";
import { Layout } from "@/components/Layout";
import { memo } from "react";
import { Details } from "./Details";
import { Header } from "./Header";
import { MemberList } from "./MemberList";
import { useTeam } from "@/hooks/useTeam";
import { Preloader } from "@/components/Preloader";

export const Team = memo(function Team() {
  const { data: team, isLoading } = useTeam();

  return (
    <AuthRequired>
      <Layout mainClassName="grid gap-y-8">
        {isLoading && (
          <div className="w-full h-full flex justify-center items-center">
            <Preloader className="w-20 h-20" />
          </div>
        )}
        {!isLoading && team && (
          <>
            <Header />
            <Details team={team} />
            {team.members && <MemberList members={team.members} />}
          </>
        )}
      </Layout>
    </AuthRequired>
  );
});
