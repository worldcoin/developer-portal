"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Skeleton from "react-loading-skeleton";
import { BasicInformationStepSkeleton } from "./BasicInformationStep";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
  wizardActionBarClassName,
  wizardActionBarInnerClassName,
  wizardBasicBodyClassName,
  wizardFrameClassName,
  wizardLogoRowClassName,
  wizardScrollRegionClassName,
  wizardStepperRowClassName,
} from "./index";

/**
 * Loading mirror of the wizard on its first step: the real frame, field
 * boxes, mode cards and action bar render for real; every data slot
 * shimmers. Data-dependent chrome is never asserted — the stepper is a plain
 * bar because mini apps have one more step, and the logo circle carries no
 * empty-state copy because a logo may exist.
 */
export const ConfigurationWizardSkeleton = () => (
  <div aria-hidden className={wizardFrameClassName}>
    <div className={wizardStepperRowClassName}>
      {/* 695px = the rendered width of the 4-step stepper, the narrowest
          real variant (mini apps get a 5th step). */}
      <Skeleton
        height={20}
        borderRadius={9999}
        containerClassName="flex h-5 w-full max-w-[695px]"
      />
    </div>

    <div className={wizardScrollRegionClassName}>
      <div className={wizardLogoRowClassName}>
        {/* LogoDropZone's size-36 circle. */}
        <Skeleton circle width={144} height={144} containerClassName="flex" />
      </div>
      <div className={wizardBasicBodyClassName}>
        <BasicInformationStepSkeleton />
      </div>
    </div>

    <div className={wizardActionBarClassName}>
      <div className={wizardActionBarInnerClassName}>
        <div className="flex flex-1 justify-start">
          {/* Back is genuinely disabled on the first step, so this matches
              the loaded state; Continue enables once data lands. */}
          <button type="button" disabled className={secondaryButtonClassName}>
            Back
          </button>
        </div>
        <div className="flex flex-1 justify-end">
          {/* Same inner typography as AppStoreActionsButton so the button
              keeps its exact width when the real action replaces it. */}
          <button type="button" disabled className={primaryButtonClassName}>
            <Typography
              variant={TYPOGRAPHY.M4}
              className="leading-none whitespace-nowrap"
            >
              Continue
            </Typography>
          </button>
        </div>
      </div>
    </div>
  </div>
);
