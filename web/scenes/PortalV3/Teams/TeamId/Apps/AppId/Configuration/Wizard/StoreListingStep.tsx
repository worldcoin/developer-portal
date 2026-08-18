"use client";

import { StoreListingFields } from "../AppStore/app-store";
import { SectionHeader } from "./SectionHeader";

/**
 * Mini-app-only step carrying the store-listing fields the previous page had
 * (category, support contact, content card image, compliance toggles). This
 * step has no Q3 2026 Figma frame yet, so it mounts the existing sections
 * unchanged for full behavior parity; restyling lands when the frame does.
 */
export const StoreListingStep = () => (
  <div className="flex w-full flex-col gap-5">
    <SectionHeader
      title="Store listing"
      description="Shape how your app appears when people discover it in the Mini App Store."
    />
    <StoreListingFields />
  </div>
);
