import cn from "classnames";
import { Layout } from "src/common/Layout";
import { Fragment, useState } from "react";
import { CardWithSideGradient } from "src/common/CardWithSideGradient";
import { Button } from "src/common/LegacyButton";
import { Widget } from "src/common/Widget";
import { Details } from "./Details";
import { useActions, useValues } from "kea";
import { teamLogic } from "src/logics/teamLogic";
import { Modal } from "src/common/LegacyModal";
import { FieldInput } from "src/common/LegacyFieldInput";
import { useToggle } from "src/hooks/useToggle";
import { text } from "src/common/styles";
import { Members } from "./Members";

export function Team(): JSX.Element | null {
  const { team } = useValues(teamLogic);
  const { deleteTeam } = useActions(teamLogic);
  const deleteModal = useToggle();
  const [deleteTeamInput, setDeleteTeamInput] = useState<string>("");

  const handleDeleteTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (team?.name !== deleteTeamInput) return;
    deleteTeam();
  };

  if (!team) {
    return null;
  }

  return (
    <Fragment>
      <Layout title="My Team">
        <CardWithSideGradient>
          <h1 className={cn(text.h1)}>My Team</h1>
          <p className="mt-2 leading-4 font-sora text-14 text-neutral">
            Update your team settings and invite others to collaborate.
          </p>
        </CardWithSideGradient>

        <Widget className="mt-8" title="Team Details" expandable opened>
          <Details />
        </Widget>

        <Widget className="mt-8" title="Team members">
          <Members />
        </Widget>

        <Button
          color="danger"
          className="block ml-auto mt-7"
          onClick={deleteModal.toggleOn}
        >
          Delete team
        </Button>
      </Layout>

      <Modal
        className="grid items-center gap-y-4 "
        close={deleteModal.toggleOff}
        isShown={deleteModal.isOn}
      >
        <p className="text-center text-[32px] font-sora leading-[1.2] font-semibold">
          Delete team
        </p>
        <p>
          This action <b>cannot be undone</b>. Are you <b>really sure</b> you
          want delete <b>{team.name}</b> team (and verification history, all
          actions, all team members)?
        </p>
        <p>Please, type team name for confirm delete</p>
        <form className="contents" onSubmit={handleDeleteTeam}>
          <FieldInput
            placeholder="Team name"
            value={deleteTeamInput}
            onChange={(e) => setDeleteTeamInput(e.target.value)}
            autoFocus
          />
          <Button
            className={cn(
              "transition-colors mt-4",
              { "bg-ff6848 text-ffffff": team.name === deleteTeamInput },
              {
                "bg-d1d3d4 text-ffffff !opacity-100 !cursor-default":
                  team.name !== deleteTeamInput,
              }
            )}
            disabled={team.name !== deleteTeamInput}
            variant="contained"
          >
            Delete {team.name} team
          </Button>
        </form>
      </Modal>
    </Fragment>
  );
}
