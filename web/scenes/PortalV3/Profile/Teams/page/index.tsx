import { PlusIcon } from "@/components/Icons/PlusIcon";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
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
              <InkButton
                href={urls.createTeam()}
                icon={<PlusIcon className="size-4" />}
              >
                New team
              </InkButton>
            </Section.Header.Button>
          </Section.Header>

          <List />
        </Section>
      </SizingWrapper>
    </>
  );
};
