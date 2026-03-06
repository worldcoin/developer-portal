"use client";

import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type SectionSubTabItem = {
  label: string;
  href: string;
  segment: string | null;
  active?: boolean;
  hidden?: boolean;
};

type SectionSubTabsProps = {
  items: SectionSubTabItem[];
  className?: string;
};

export const SectionSubTabs = ({ items, className }: SectionSubTabsProps) => {
  return (
    <Tabs className={className ?? "px-6 py-4 font-gta md:py-0"}>
      {items
        .filter((item) => !item.hidden)
        .map((item) => (
          <Tab
            key={`${item.href}:${item.label}`}
            className="md:py-4"
            href={item.href}
            segment={item.segment}
            active={item.active}
          >
            <Typography variant={TYPOGRAPHY.R4}>{item.label}</Typography>
          </Tab>
        ))}
    </Tabs>
  );
};
