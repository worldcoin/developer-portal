import { AppReviewStatus } from "@/lib/types";
import { useAppStore } from "@/stores/appStore";
import React, { memo, useState } from "react";

export const AppReviewStatusHeader = memo(function AppReviewStatusHeader() {
  const currentApp = useAppStore((store) => store.currentApp);
  const reviewMessage = currentApp?.app_metadata?.review_message;
  const verificationStatus = currentApp?.app_metadata
    ?.verification_status as keyof typeof AppReviewStatus;
  const [isDropdownOpen, setIsDropdownOpen] = useState(
    verificationStatus === "changes_requested"
  );
  const canShowReviewMessage =
    reviewMessage &&
    !["verified", "awaiting_review"].includes(verificationStatus);

  const renderNote = () => {
    if (["awaiting_review", "changes_requested"].includes(verificationStatus)) {
      return (
        <div className="text-warning">
          Note: You must un-submit from review to make changes
        </div>
      );
    }
    if (
      verificationStatus === "verified" &&
      currentApp?.verified_app_metadata
    ) {
      return (
        <div className="text-primary">
          Note: Any changes to verified apps will require re-review. <br />
          Your existing verified information will continue to be available to
          users until the review is complete.
        </div>
      );
    }
    return null;
  };
  return (
    <div className="p-4 border rounded-lg  space-y-2">
      <div className="font-bold text-lg">
        Review Status:{" "}
        <span className="capitalize">
          {AppReviewStatus[verificationStatus]}
        </span>
      </div>
      {canShowReviewMessage && (
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
      {renderNote()}
    </div>
  );
});
