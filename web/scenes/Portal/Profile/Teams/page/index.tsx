import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { List } from "@/scenes/Portal/Profile/Teams/page/List";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";

export const TeamsPage = () => {
  return (
    <>
      <SizingWrapper gridClassName="order-1 pt-8" className="grid gap-y-8">
        <UserInfo />

        <div className="border-b border-dashed border-grey-200" />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 gap-y-8 py-8">
        <div className="grid grid-cols-[1fr_auto] items-center">
          <Typography as="h1" variant={TYPOGRAPHY.H7}>
            Teams
          </Typography>

          <DecoratedButton
            variant="primary"
            href={urls.createTeam()}
            className="py-3"
          >
            Create new team
          </DecoratedButton>
        </div>

        <List />
      </SizingWrapper>
    </>
  );
};
