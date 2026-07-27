import { Button } from "@/components/Button";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import { CREATE_TEAM_DIALOG_URL } from "@/scenes/Onboarding/CreateTeam/dialogRouting";
import { List } from "@/scenes/PortalV3/Profile/Teams/page/List";
import { UserInfo } from "@/scenes/PortalV3/Profile/common/UserInfo";

export const TeamsPage = () => {
  return (
    <>
      <SizingWrapper gridClassName="order-1">
        <UserInfo />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        <Section>
          <Section.Header>
            <Section.Header.Title>Teams</Section.Header.Title>

            <Section.Header.Button>
              <Button
                href={CREATE_TEAM_DIALOG_URL}
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-8 bg-portal-ink px-4 font-world text-13 leading-none font-medium text-white transition-colors hover:bg-portal-ink-hover focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden"
              >
                <PlusIcon className="size-4" />
                New team
              </Button>
            </Section.Header.Button>
          </Section.Header>

          <List />
        </Section>
      </SizingWrapper>
    </>
  );
};
