import { AppReviewStatus } from "@/lib/types";
import { useAppStore } from "@/stores/appStore";
import React, { memo, useState } from "react";

export const AppReviewStatusHeader = memo(function AppReviewStatusHeader() {
  const currentApp = useAppStore((store) => store.currentApp);
  const reviewMessage = currentApp?.app_metadata?.review_message;
  const status = currentApp?.app_metadata
    ?.status as keyof typeof AppReviewStatus;
  const [isDropdownOpen, setIsDropdownOpen] = useState(
    status === "changes_requested"
  );

  return (
    <div className="p-4 border rounded-lg  space-y-2">
      <div className="font-bold text-lg">
        Review Status:{" "}
        <span className="capitalize">{AppReviewStatus[status]}</span>
      </div>
      {reviewMessage && !["verified", "awaiting_review"].includes(status) && (
        <div>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-sm text-primary focus:outline-none"
          >
            {isDropdownOpen ? "Hide Review Message" : "Show Review Message"}
          </button>
          {isDropdownOpen && (
            <div className="mt-2 p-2 border-2 rounded-lg text-sm text-gray-600">
              {reviewMessage}
            </div>
          )}
        </div>
      )}
      {status !== "unverified" && (
        <div className="text-warning">
          Note: You must un-submit from review to make changes
        </div>
      )}
      {status === "unverified" && currentApp?.verified_app_metadata && (
        <div className="text-warning">
          Note: Any changes to verified apps will require re-review
        </div>
      )}
    </div>
  );
});
