"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DeleteTeamDialog } from "@/scenes/PortalV3/common/DeleteTeamDialog";
import { useState } from "react";
import { truncateString } from "@/lib/utils";
import clsx from "clsx";

// Team is fetched once by the parent settings page and passed in, so this
// section no longer fires its own useFetchTeamQuery. Renders nothing until the
// team resolves (same behavior as before, just without a duplicate query).
// `canWrite` disables the delete action for non-owners.
export const TeamDangerZone = (props: {
  team: { id?: string | null; name?: string | null } | null;
  canWrite: boolean;
}) => {
  const { team, canWrite } = props;
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  if (!team) {
    return null;
  }

  return (
    <>
      <section className="flex flex-col gap-4 rounded-12 border border-system-error-300 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="font-world text-13 leading-5 font-medium text-system-error-600">
            Delete team
          </h2>

          <p
            className={
              !canWrite
                ? "mt-1 font-gta text-13 leading-5 text-grey-400"
                : "mt-1 font-gta text-13 leading-5 text-grey-500"
            }
          >
            This will immediately and permanently delete the team{" "}
            <strong
              className={
                !canWrite
                  ? "font-medium text-grey-400"
                  : "font-medium text-grey-900"
              }
            >
              {truncateString(team.name, 30)}
            </strong>
            , along with all its applications and its data for everyone. This
            cannot be undone.
          </p>
        </div>

        <DecoratedButton
          type="button"
          variant="destructive"
          className={clsx(
            "h-8 shrink-0 rounded-8 px-4 py-0 font-world text-13 focus-visible:ring-2 focus-visible:ring-system-error-300 focus-visible:ring-offset-2 focus-visible:outline-hidden",
            canWrite &&
              "border-system-error-600 bg-system-error-600 hover:border-system-error-600 hover:bg-system-error-600",
          )}
          disabled={!canWrite}
          onClick={() => {
            if (!canWrite) {
              return;
            }
            setIsOpenDeleteDialog(true);
          }}
        >
          Delete team
        </DecoratedButton>
      </section>

      {canWrite ? (
        <DeleteTeamDialog
          open={isOpenDeleteDialog}
          onClose={() => setIsOpenDeleteDialog(false)}
          team={{
            id: team.id,
            name: team.name,
          }}
        />
      ) : null}
    </>
  );
};
