"use client";

import Skeleton from "react-loading-skeleton";
import { McpSetup } from "../../sections/ApiKeys/McpSetup";

export const GeneralSettingsLoadingState = (props: {
  canWriteTeamSettings: boolean;
}) => {
  const dangerAction = props.canWriteTeamSettings
    ? "Delete team"
    : "Leave team";
  const dangerDescription = props.canWriteTeamSettings
    ? "Permanently delete this team and all of its apps."
    : "You will need another invitation to rejoin this team.";

  return (
    <div className="w-full px-4 pt-[23px] pb-28 sm:px-6" aria-busy="true">
      <div className="w-full max-w-[800px]">
        <h1 className="font-world text-19 leading-[1.2] font-[500] tracking-[-0.01em] text-portal-ink">
          General
        </h1>

        <section aria-labelledby="loading-team-name-heading" className="mt-10">
          <h2
            id="loading-team-name-heading"
            className="font-world text-15 leading-[1.2] font-[450] text-portal-ink"
          >
            Team name
          </h2>
          <div className="mt-4" aria-hidden="true">
            <Skeleton height={40} borderRadius={10} />
          </div>
        </section>

        <div className="mt-10 border-t border-portal-border" />

        <div className="mt-10">
          <McpSetup />
        </div>

        <div className="mt-10 border-t border-portal-border" />

        <section
          aria-labelledby="loading-danger-zone-heading"
          className="mt-10"
        >
          <h2
            id="loading-danger-zone-heading"
            className="font-world text-17 leading-[1.2] font-[450] tracking-[-0.01em] text-portal-ink"
          >
            Danger zone
          </h2>

          <div className="mt-4 flex min-h-[71px] flex-col items-start justify-between gap-4 rounded-[10px] border border-portal-border p-[15px] sm:flex-row sm:items-center sm:gap-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-world text-15 leading-[1.2] font-[450] text-portal-ink">
                {dangerAction}
              </h3>
              <p className="mt-1 font-world text-13 leading-[1.3] font-[350] text-[#7d7d7d]">
                {dangerDescription}
              </p>
            </div>
            <div className="w-[100px] shrink-0" aria-hidden="true">
              <Skeleton height={32} borderRadius={999} />
            </div>
          </div>
        </section>

        <span className="sr-only" role="status">
          Loading team settings
        </span>
      </div>
    </div>
  );
};
