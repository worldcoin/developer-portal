import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { List } from "@/scenes/Portal/Profile/Teams/page/List";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import {Section} from "@/components/Section";

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
              <DecoratedButton
                variant="primary"
                href={urls.createTeam()}
                className="py-3"
              >
                <PlusIcon className="size-5" /> New team
              </DecoratedButton>
            </Section.Header.Button>
          </Section.Header>

          <List />
        </Section>
      </SizingWrapper>
    </>
  );
};
