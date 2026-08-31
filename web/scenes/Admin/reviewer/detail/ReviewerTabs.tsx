"use client";

import type { KeyboardEvent } from "react";

import {
  REVIEWER_PANELS,
  reviewerPanelLabel,
  type ReviewerPanel,
} from "./reviewer-panels";

const getTabId = (panel: ReviewerPanel) => `reviewer-tab-${panel}`;

const getPanelId = (panel: ReviewerPanel) => `reviewer-panel-${panel}`;

export const ReviewerTabs = ({
  activePanel,
  onChange,
}: {
  activePanel: ReviewerPanel;
  onChange: (panel: ReviewerPanel) => void;
}) => {
  const focusPanel = (panel: ReviewerPanel) => {
    document.getElementById(getTabId(panel))?.focus();
    onChange(panel);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const activeIndex = REVIEWER_PANELS.indexOf(activePanel);
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
        nextIndex =
          (activeIndex - 1 + REVIEWER_PANELS.length) % REVIEWER_PANELS.length;
        break;
      case "ArrowRight":
        nextIndex = (activeIndex + 1) % REVIEWER_PANELS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = REVIEWER_PANELS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    focusPanel(REVIEWER_PANELS[nextIndex]);
  };

  return (
    <div
      aria-label="Reviewer workspace sections"
      aria-orientation="horizontal"
      className="flex overflow-x-auto"
      role="tablist"
    >
      {REVIEWER_PANELS.map((panel) => {
        const isActive = panel === activePanel;

        return (
          <button
            aria-controls={getPanelId(panel)}
            aria-selected={isActive}
            className={
              isActive
                ? "min-h-11 shrink-0 border-b-2 border-grey-900 px-3 py-2 text-13 font-semibold text-grey-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
                : "min-h-11 shrink-0 border-b-2 border-transparent px-3 py-2 text-13 font-medium text-grey-500 outline-none hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
            }
            id={getTabId(panel)}
            key={panel}
            onClick={() => onChange(panel)}
            onKeyDown={handleKeyDown}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {reviewerPanelLabel[panel]}
          </button>
        );
      })}
    </div>
  );
};
