"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DeleteTeamDialog } from "@/scenes/PortalV3/common/DeleteTeamDialog";
import { useState } from "react";
import { Section } from "@/components/Section";
import { truncateString } from "@/lib/utils";

// Team is fetched once by the parent settings page and passed in, so this
// section no longer fires its own useFetchTeamQuery. Renders nothing until the
// team resolves (same behavior as before, just without a duplicate query).
export const TeamDangerZone = (props: {
  team: { id?: string | null; name?: string | null } | null;
}) => {
  const { team } = props;
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  if (!team) {
    return null;
  }

  return (
    <>
      <Section>
        <Section.Header>
          <Section.Header.Title>Danger zone</Section.Header.Title>
        </Section.Header>

        <div className="grid justify-items-start gap-y-8 max-md:pb-8 md:max-w-[36.25rem]">
          <p className="text-grey-500">
            This will immediately and permanently delete the team{" "}
            <strong className="font-medium text-grey-900">
              {truncateString(team.name, 30)}
            </strong>
            , along with all its applications and its data for everyone. This
            cannot be undone.
          </p>

          <DecoratedButton
            type="submit"
            variant="danger"
            onClick={() => setIsOpenDeleteDialog(true)}
          >
            Delete team
          </DecoratedButton>
        </div>
      </Section>

      <DeleteTeamDialog
        open={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        team={{
          id: team.id,
          name: team.name,
        }}
      />
    </>
  );
};
