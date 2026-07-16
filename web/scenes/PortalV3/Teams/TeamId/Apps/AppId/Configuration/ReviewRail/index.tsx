import { LivePreview } from "./LivePreview";
import type { FullAppMetadata } from "./types";

export { ConfigurationPrimaryAction } from "./ConfigurationPrimaryAction";

type ReviewRailProps = {
  appId: string;
  teamName: string;
  appMetadata: FullAppMetadata;
};

/** Live listing preview, intentionally isolated from page-level actions. */
export const ReviewRail = ({
  appId,
  teamName,
  appMetadata,
}: ReviewRailProps) => {
  return (
    <aside
      aria-label="Live preview"
      className="order-first h-full lg:order-0 lg:border-l lg:border-grey-200 lg:pl-10"
    >
      <div className="flex flex-col gap-y-5 py-8 lg:h-full">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <LivePreview
            appId={appId}
            teamName={teamName}
            appMetadata={appMetadata}
          />
        </div>
      </div>
    </aside>
  );
};
