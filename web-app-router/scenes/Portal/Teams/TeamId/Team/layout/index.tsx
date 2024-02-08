import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamIdLayoutProps = {
  params: Params;
  children: ReactNode;
};

export const TeamIdLayout = (props: TeamIdLayoutProps) => {
  const params = props.params;

  return (
    <div>
      <div className="h-full w-full">
        <div className="bg-grey-50 border-b border-grey-100">
          <SizingWrapper>
            <Tabs className="max-w-[1180px] m-auto font-gta">
              <Tab
                className="py-4"
                href={`/teams/${params!.teamId}`}
                segment={null}
              >
                <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
              </Tab>

              <Tab
                className="py-4"
                href={`/teams/${params!.teamId}/settings`}
                segment={"settings"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Team settings</Typography>
              </Tab>

              <Tab
                className="py-4"
                href={`/teams/${params!.teamId}/api-keys`}
                segment={"api-keys"}
              >
                <Typography variant={TYPOGRAPHY.R4}>API keys</Typography>
              </Tab>

              <Tab
                className="py-4"
                href={`/teams/${params!.teamId}/danger`}
                segment={"danger"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
              </Tab>
            </Tabs>
          </SizingWrapper>
        </div>

        <SizingWrapper className="h-full">{props.children}</SizingWrapper>
      </div>
    </div>
  );
};
