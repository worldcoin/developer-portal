"use client";

import clsx from "clsx";

export type ChartTabType = "verifications" | "payments" | "notifications";

interface ChartTabsProps {
  activeTab: ChartTabType;
  onTabChange: (tab: ChartTabType) => void;
}

const tabs: { value: ChartTabType; label: string }[] = [
  { value: "verifications", label: "Verifications" },
  { value: "payments", label: "Payments" },
  { value: "notifications", label: "Notifications" },
];

export const ChartTabs = ({ activeTab, onTabChange }: ChartTabsProps) => {
  return (
    <div className="flex gap-x-6">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={clsx(
            "border-b-2 pb-2 font-world text-13 font-medium leading-none transition-colors",
            activeTab === tab.value
              ? "border-portal-text text-portal-text"
              : "border-transparent text-portal-muted hover:text-portal-text",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
