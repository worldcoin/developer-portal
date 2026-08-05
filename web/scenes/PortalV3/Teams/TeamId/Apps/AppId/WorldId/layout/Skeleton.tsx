"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { WORLD_ID_TABS, type WorldIdTab } from "@/lib/world-id-tabs";
import { LegacyActionsDeprecationBanner } from "../LegacyActions/page";
import { ActionCardSkeleton } from "../page/ActionCard/Skeleton";
import { CreateActionTile } from "../page/ActionsGrid/CreateActionTile";
import { ActionsSearchToolbar } from "./ActionsSearchToolbar";
import { SummaryField, SummaryFieldSkeleton } from "./SummaryField";

const ActionCardsGridSkeleton = (props: { withCreateTile?: boolean }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {/* No onClick — the tile renders disabled until the real grid mounts. */}
    {props.withCreateTile && <CreateActionTile />}
    <ActionCardSkeleton />
    <ActionCardSkeleton />
    <ActionCardSkeleton />
  </div>
);

/**
 * Loading mirror of the World ID section, shaped by the tab the URL already
 * names — the loaded tab then fills in place. A bare /world-id entry has no
 * tab yet, so it gets the Actions shape, the default for registered apps.
 * Data-dependent chrome is not asserted — no Key/Danger zone sections, and
 * the signer value shimmers (registered shows an address, unregistered the
 * register button) — with one deliberate exception: managers get the create
 * tile, because an active RP is by far the common case on the Actions tab;
 * an inactive one drops the tile when data lands.
 */
export const WorldIdLayoutSkeleton = (props: {
  tab: WorldIdTab | null;
  appId: string;
  canManageWorldId: boolean;
}) => {
  const tab = props.tab ?? WORLD_ID_TABS.Actions;

  if (tab === WORLD_ID_TABS.Configuration) {
    return (
      <div className="flex flex-col gap-4">
        <Typography as="h2" variant={TYPOGRAPHY.H7} className="text-portal-ink">
          World ID Configuration
        </Typography>

        {/* RpSummary's section wrappers, so the field stack lands where the
            loaded fields (or the register empty state) will. Only the App ID
            renders for real — the RP ID is stored data now, so it shimmers
            until it loads and reads "—" if the app is unregistered. */}
        <section className="flex w-full max-w-[580px] flex-col gap-4">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <SummaryField label="App ID" value={props.appId} copy />
              <SummaryFieldSkeleton label="RP ID" />
              <SummaryFieldSkeleton label="Signer address" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  const isLegacyActions = tab === WORLD_ID_TABS.LegacyActions;

  return (
    // inert: the toolbar is the real search box; it must not accept input
    // before the grid exists to filter.
    <div aria-hidden inert className="flex flex-col gap-6">
      <ActionsSearchToolbar search="" onSearchChange={() => {}} />

      {isLegacyActions && (
        // LegacyActionsPage's own wrapper: banner + grid share a gap-6 column.
        <div className="flex flex-col gap-6">
          <LegacyActionsDeprecationBanner />
          <ActionCardsGridSkeleton />
        </div>
      )}
      {!isLegacyActions && (
        <ActionCardsGridSkeleton withCreateTile={props.canManageWorldId} />
      )}
    </div>
  );
};
