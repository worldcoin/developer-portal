"use client";

import type { ReviewerAppMode, ReviewerSubmissionStatus } from "../types";
import type { ReviewerPanel } from "./reviewer-panels";
import { ReviewerTabs } from "./ReviewerTabs";

export const ReviewerHeader = ({
  activePanel,
  appId,
  appMode,
  appName,
  attempt,
  onPanelChange,
  status,
}: {
  activePanel: ReviewerPanel;
  appId: string;
  appMode: ReviewerAppMode;
  appName: string;
  attempt: number;
  onPanelChange: (panel: ReviewerPanel) => void;
  status: ReviewerSubmissionStatus;
}) => (
  <header className="rounded-16 border border-grey-200 bg-grey-0/90 p-5 backdrop-blur-md">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-11 font-medium tracking-wide text-grey-400 uppercase">
          Reviewer / {appMode === "mini-app" ? "Mini App" : "External"}
        </p>
        <h1 className="mt-2 text-24 font-semibold tracking-[-0.02em] text-grey-900">
          {appName}
        </h1>
        <p className="mt-1 font-mono text-11 text-grey-500">
          {appId} · attempt {attempt}
        </p>
      </div>
      <span
        aria-label="Review status"
        className="rounded-full border border-grey-200 bg-grey-50 px-3 py-1.5 text-12 font-semibold text-grey-700"
      >
        {status.replaceAll("_", " ")}
      </span>
    </div>
    <div className="mt-4 border-t border-grey-200 pt-1">
      <ReviewerTabs activePanel={activePanel} onChange={onPanelChange} />
    </div>
  </header>
);
