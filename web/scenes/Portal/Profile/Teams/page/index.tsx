import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { List } from "@/scenes/Portal/Profile/Teams/page/List";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";

export const TeamsPage = () => {
  return (
    <>
      <div className="pt-9">
        <SizingWrapper className="grid gap-y-8">
          <UserInfo />

          <div className="border-b border-dashed border-grey-200" />
        </SizingWrapper>
      </div>

      <SizingWrapper>
        <div className="m-auto grid gap-y-8 py-8">
          <div className="grid grid-cols-[1fr_auto]">
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
        </div>
      </SizingWrapper>
    </>
  );
};
