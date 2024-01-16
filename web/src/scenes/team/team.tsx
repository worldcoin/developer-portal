import { Layout } from "@/components/Layout";
import { memo } from "react";
import { MemberList } from "./MemberList";
import { Preloader } from "@/components/Preloader";
import { useTeam } from "@/scenes/team/hooks/useTeam";
import useKeys from "src/hooks/useKeys";
import { KeyList } from "./KeyList";
import { Icon } from "@/components/Icon";
import { useToggle } from "@/hooks/useToggle";
import { EditDialog } from "./EditDialog";
import Link from "next/link";

export const Team = memo(function Team() {
  const { data: team, loading } = useTeam();
  const { keys, isLoading } = useKeys();

  const editDialog = useToggle();

  return (
    <Layout mainClassName="grid gap-y-8">
      <div className="flex items-center gap-x-2">
        <Link className="flex items-center gap-x-1" href="/">
          <Icon name="home" className="w-3 h-3" />
          <span className="inline-block text-12 leading-[12px]">Home</span>
        </Link>

        <Icon name="chevron-right" className="w-3 h-3 text-gray-400" />

        <div className="flex items-center gap-x-1">
          <span className="inline-block text-12 leading-[12px]">Team</span>
        </div>
      </div>

      {loading && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}
      {!loading && !isLoading && team && (
        <>
          <div className="max-w-[560px] w-full mx-auto">
            <div className="grid grid-cols-auto/1fr items-center gap-x-4">
              <div className="grid place-items-center w-[60px] h-[60px] text-primary bg-primary-light rounded-full">
                <Icon name="team" className="w-8 h-8" />
              </div>

              <div>
                <div className="flex items-center gap-x-1 leading-8 font-medium text-24 text-gray-900">
                  {team.name}

                  <button
                    className="flex items-center p-2 text-gray-400"
                    onClick={editDialog.toggleOn}
                  >
                    <Icon name="edit-2" className="w-4 h-4" />
                  </button>
                </div>

                <div className="leading-5 text-14 text-gray-500">
                  Manage your team and invite others to collaborate
                </div>
              </div>
            </div>

            <MemberList team={team} members={team.members} />
          </div>

          <EditDialog
            team={team}
            open={editDialog.isOn}
            onClose={editDialog.toggleOff}
          />

          {keys && <KeyList keys={keys} />}
        </>
      )}
    </Layout>
  );
});
