"use client";

import { useEffect, useRef, useState } from "react";
import type { ConfigurationPrimaryActionKind } from "./types";

const EXIT_KEYFRAMES: Keyframe[] = [
  { opacity: 1, transform: "translateY(0)" },
  { opacity: 0, transform: "translateY(-2px)" },
];

const ENTER_KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: "translateY(2px)" },
  { opacity: 1, transform: "translateY(0)" },
];

/**
 * Swaps the action label while it is invisible. A single live label avoids the
 * ghosting that overlapping incoming and outgoing text can cause.
 */
export const usePrimaryActionLabelTransition = (
  targetActionKind: ConfigurationPrimaryActionKind,
) => {
  const [displayedActionKind, setDisplayedActionKind] =
    useState<ConfigurationPrimaryActionKind>(targetActionKind);
  const displayedActionKindRef = useRef(displayedActionKind);
  const contentRef = useRef<HTMLSpanElement>(null);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (displayedActionKindRef.current === targetActionKind) return;

    const content = contentRef.current;
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const showTargetAction = () => {
      displayedActionKindRef.current = targetActionKind;
      setDisplayedActionKind(targetActionKind);
    };

    if (!content?.animate || prefersReducedMotion) {
      isTransitioningRef.current = false;
      showTargetAction();
      return;
    }

    let cancelled = false;
    isTransitioningRef.current = true;

    const transitionLabel = async () => {
      content.getAnimations().forEach((animation) => animation.cancel());

      try {
        await content.animate(EXIT_KEYFRAMES, {
          duration: 70,
          easing: "ease-in",
          fill: "forwards",
        }).finished;
      } catch {
        if (!cancelled) {
          showTargetAction();
          isTransitioningRef.current = false;
        }
        return;
      }

      if (cancelled) return;
      showTargetAction();

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (cancelled) return;

      content.getAnimations().forEach((animation) => animation.cancel());

      try {
        await content.animate(ENTER_KEYFRAMES, {
          duration: 110,
          easing: "ease-out",
        }).finished;
      } catch {
        // Cancellation is expected when the target changes or the component
        // unmounts; the default DOM styles already leave the new label visible.
      } finally {
        if (!cancelled) isTransitioningRef.current = false;
      }
    };

    void transitionLabel();

    return () => {
      cancelled = true;
      isTransitioningRef.current = false;
      content.getAnimations().forEach((animation) => animation.cancel());
    };
  }, [targetActionKind]);

  return { contentRef, displayedActionKind, isTransitioningRef };
};
