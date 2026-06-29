"use client";

import { WorldIcon } from "@/components/Icons/WorldIcon";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

const LOOP_PERIOD_MS = 2750;
const RETURN_MS = 400;

type SpinningWorldIconProps = {
  className?: string;
  spinMode?: "loop" | "once";
  wrapperClassName?: string;
};

export const SpinningWorldIcon = ({
  className,
  spinMode = "loop",
  wrapperClassName,
}: SpinningWorldIconProps) => {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const rotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    const interactive = wrapper.closest("a, button");

    if (!interactive) {
      return;
    }

    const setRotationDegrees = (deg: number) => {
      rotationRef.current = deg;
      setRotation(deg);
    };

    const cancelAnimation = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const animateTo = (
      from: number,
      to: number,
      duration: number,
      onComplete?: () => void,
    ) => {
      cancelAnimation();
      const start = performance.now();

      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setRotationDegrees(from + (to - from) * eased);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          onComplete?.();
        }
      };

      rafRef.current = requestAnimationFrame(step);
    };

    const smoothReturnToReset = () => {
      cancelAnimation();

      const from = rotationRef.current;
      const target = Math.round(from / 360) * 360;

      if (Math.abs(from - target) < 0.5) {
        setRotationDegrees(0);
        return;
      }

      animateTo(from, target, RETURN_MS, () => {
        setRotationDegrees(0);
      });
    };

    const startLoop = () => {
      if (reduceMotionRef.current) {
        return;
      }

      cancelAnimation();

      const startRotation = rotationRef.current;
      const start = performance.now();

      const step = (now: number) => {
        const elapsed = now - start;
        setRotationDegrees(
          startRotation + (elapsed / LOOP_PERIOD_MS) * 360,
        );
        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);
    };

    const startOnce = () => {
      if (reduceMotionRef.current) {
        return;
      }

      const from = rotationRef.current;
      animateTo(from, from + 360, LOOP_PERIOD_MS, () => {
        setRotationDegrees(0);
      });
    };

    const onEnter = () => {
      if (reduceMotionRef.current) {
        return;
      }

      if (spinMode === "once") {
        startOnce();
      } else {
        startLoop();
      }
    };

    const onLeave = () => {
      smoothReturnToReset();
    };

    interactive.addEventListener("mouseenter", onEnter);
    interactive.addEventListener("mouseleave", onLeave);

    return () => {
      interactive.removeEventListener("mouseenter", onEnter);
      interactive.removeEventListener("mouseleave", onLeave);
      cancelAnimation();
    };
  }, [spinMode]);

  return (
    <span
      className={clsx("inline-flex items-center justify-center", wrapperClassName)}
      ref={wrapperRef}
    >
      <WorldIcon
        className={className}
        style={{ transform: `rotate(${rotation}deg)` }}
      />
    </span>
  );
};
