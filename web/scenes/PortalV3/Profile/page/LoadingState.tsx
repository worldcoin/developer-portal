import { DestructiveTriggerButton } from "@/components/DestructiveTriggerButton";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import Skeleton from "react-loading-skeleton";
import { ProfilePageFrame, ProfileSectionDivider } from "./ProfilePageFrame";

const TeamRowSkeleton = () => (
  <div className="flex h-[69px] items-center justify-between gap-4 px-4">
    <div className="flex min-w-0 items-center gap-4">
      <Skeleton width={32} height={32} circle inline />
      <div className="grid gap-0.5">
        <Skeleton width={112} height={18} />
        <Skeleton width={44} height={17} />
      </div>
    </div>

    <Skeleton width={20} height={20} borderRadius={6} />
  </div>
);

export const ProfileLoadingState = () => {
  return (
    <ProfilePageFrame busy>
      <div className="mt-10" data-testid="profile-loading-state">
        <section aria-labelledby="profile-display-name-loading">
          <div className="grid gap-4">
            <h2
              id="profile-display-name-loading"
              className="font-world text-15 leading-[1.2] font-[350] text-portal-ink"
            >
              Display name
            </h2>
            <Skeleton height={40} borderRadius={10} />
          </div>

          <div className="mt-4 flex min-h-[69px] items-center justify-between gap-4 rounded-[10px] border border-portal-border px-4 py-4">
            <div className="min-w-0">
              <h3 className="font-world text-15 leading-[1.2] font-[350] text-portal-ink">
                Allow analytics
              </h3>
              <p className="mt-0.5 font-world text-13 leading-[1.3] font-[350] text-portal-subtle">
                We collect analytics in the developer portal to help us provide
                a better experience to you.
              </p>
            </div>

            <Skeleton
              className="shrink-0"
              width={40}
              height={24}
              borderRadius={999}
            />
          </div>
        </section>

        <ProfileSectionDivider />

        <section aria-labelledby="profile-teams-loading">
          <header className="flex h-8 items-center justify-between gap-4">
            <h2
              id="profile-teams-loading"
              className="font-twk text-17 leading-5 font-[550] tracking-[-0.17px] text-portal-ink"
            >
              Your teams
            </h2>

            <InkButton
              type="button"
              className="h-8"
              icon={<PlusIcon className="size-4" />}
              disabled
            >
              New team
            </InkButton>
          </header>

          <div className="mt-2.5 overflow-hidden rounded-[10px] border border-portal-border">
            <TeamRowSkeleton />
            <TeamRowSkeleton />
          </div>
        </section>

        <ProfileSectionDivider />

        <section aria-labelledby="profile-danger-loading">
          <h2
            id="profile-danger-loading"
            className="font-twk text-17 leading-5 font-[550] tracking-[-0.17px] text-portal-ink"
          >
            Danger zone
          </h2>

          <div className="mt-4 flex min-h-[71px] flex-col gap-4 rounded-[10px] border border-portal-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-world text-15 leading-[1.2] font-[350] text-portal-ink">
                Delete account
              </h3>
              <p className="mt-1 font-world text-13 leading-[1.3] font-[350] text-portal-subtle">
                Permanently delete this account and all of its apps.
              </p>
            </div>

            <DestructiveTriggerButton disabled>
              Delete account
            </DestructiveTriggerButton>
          </div>
        </section>
      </div>
    </ProfilePageFrame>
  );
};
