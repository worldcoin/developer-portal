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
            "pb-2 text-14 font-medium transition-colors",
            activeTab === tab.value
              ? "border-b-2 border-grey-900 text-grey-900"
              : "text-grey-500 hover:text-grey-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
