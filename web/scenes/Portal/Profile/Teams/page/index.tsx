import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { List } from "@/scenes/Portal/Profile/Teams/page/List";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";
import { PlusIcon } from "@/components/Icons/PlusIcon";

export const TeamsPage = () => {
  return (
    <>
      <SizingWrapper gridClassName="order-1" className="grid gap-y-8">
        <UserInfo />
      </SizingWrapper>

      <SizingWrapper
        gridClassName="grow order-2 gap-y-8 mt-8"
        className="flex flex-col"
      >
        <div className="order-1 contents md:grid md:grid-cols-[1fr_auto] md:items-start">
          <Typography as="h1" variant={TYPOGRAPHY.H7}>
            Teams
          </Typography>

          <div className="order-2 max-md:sticky max-md:bottom-0 max-md:order-4 max-md:grid max-md:justify-center max-md:py-8">
            <DecoratedButton
              variant="primary"
              href={urls.createTeam()}
              className="py-3"
            >
              <PlusIcon className="size-5" /> New team
            </DecoratedButton>
          </div>
        </div>

        <div className="order-3 grow md:pb-8">
          <List />
        </div>
      </SizingWrapper>
    </>
  );
};
