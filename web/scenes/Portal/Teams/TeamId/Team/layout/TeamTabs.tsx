"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { usePathname } from "next/navigation";

type TabsWrapperProps = {
  teamId: string;
  hasOwnerPermission: boolean;
  hasOwnerAndAdminPermission: boolean;
};

export const TeamTabs = ({
  teamId,
  hasOwnerPermission,
  hasOwnerAndAdminPermission,
}: TabsWrapperProps) => {
  const pathname = usePathname();
  const isAffiliateProgram = pathname.includes("affiliate-program");

  const getTabs = () => {
    if (isAffiliateProgram) {
      return (
        <>
          <Tab
            className="md:py-4"
            href={`/teams/${teamId}/affiliate-program`}
            segment={null}
            underlined
          >
            <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
          </Tab>
          <Tab
            className="md:py-4"
            href={`/teams/${teamId}/affiliate-program/earnings`}
            segment={"earnings"}
            underlined
          >
            <Typography variant={TYPOGRAPHY.R4}>Earnings</Typography>
          </Tab>
          <Tab
            className="md:py-4"
            href={`/teams/${teamId}/affiliate-program/how-it-works`}
            segment={"how-it-works"}
            underlined
          >
            <Typography variant={TYPOGRAPHY.R4}>How it works</Typography>
          </Tab>
          <Tab
            className="md:py-4"
            href={`/teams/${teamId}/affiliate-program/invoices`}
            segment={"invoices"}
            underlined
          >
            <Typography variant={TYPOGRAPHY.R4}>Invoices</Typography>
          </Tab>
        </>
      );
    }

    return (
      <>
        <Tab
          className="md:py-4"
          href={`/teams/${teamId}`}
          segment={null}
          underlined
        >
          <Typography variant={TYPOGRAPHY.R4}>
            <span className="max-md:hidden">Members</span>
            <span className="md:hidden">Members</span>
          </Typography>
        </Tab>

        <Tab
          className="md:hidden"
          href={`/teams/${teamId}/app`}
          segment={"app"}
          underlined
        >
          <Typography variant={TYPOGRAPHY.R4}>Apps</Typography>
        </Tab>

        {hasOwnerPermission && (
          <Tab
            className="md:py-4"
            href={`/teams/${teamId}/settings`}
            segment={"settings"}
            underlined
          >
            <Typography variant={TYPOGRAPHY.R4}>Team settings</Typography>
          </Tab>
        )}

        {hasOwnerAndAdminPermission && (
          <Tab
            className="md:py-4"
            href={`/teams/${teamId}/api-keys`}
            segment={"api-keys"}
            underlined
          >
            <Typography variant={TYPOGRAPHY.R4}>API keys</Typography>
          </Tab>
        )}

        {hasOwnerPermission && (
          <Tab
            className="md:py-4"
            href={`/teams/${teamId}/danger`}
            segment={"danger"}
            underlined
          >
            <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
          </Tab>
        )}
      </>
    );
  };

  return <Tabs className="px-6 py-4 font-gta md:py-0">{getTabs()}</Tabs>;
};
