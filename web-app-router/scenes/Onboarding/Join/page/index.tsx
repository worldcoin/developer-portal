"use client";

import {
  CircleIconContainer,
  CircleIconContainerProps,
} from "@/components/CircleIconContainer";

import { AlertIcon } from "@/components/icons/AlertIcon";
import { useEffect, useState } from "react";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SuccessIcon } from "@/components/icons/SuccessIcon";

export const JoinPage = () => {
  const [variant, setVariant] =
    useState<CircleIconContainerProps["variant"]>("success");

  useEffect(() => {
    const interval = setInterval(() => {
      setVariant((prev) => {
        if (prev === "success") return "error";
        if (prev === "error") return "info";
        if (prev === "info") return "muted";
        if (prev === "muted") return "success";
        return "success";
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col p-10 items-center justify-center gap-2 h-screen">
      <CircleIconContainer variant={variant}>
        <AlertIcon />
      </CircleIconContainer>

      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="primary"
          icon={<SuccessIcon />}
          showArrowRight
        >
          Primary
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="primary"
          className="w-72"
          icon={<SuccessIcon />}
          showArrowRight
          disabled
        >
          Primary: Disabled
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="primary"
          loading
          className="w-72"
          showArrowRight
          icon={<SuccessIcon />}
        >
          Primary: Loading
        </DecoratedButton>
      </div>
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="secondary"
          icon={<SuccessIcon />}
          showArrowRight
        >
          Secondary
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-72"
          icon={<SuccessIcon />}
          showArrowRight
          disabled
        >
          Secondary: Disabled
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          loading
          className="w-72"
          showArrowRight
          icon={<SuccessIcon />}
        >
          Secondary: Loading
        </DecoratedButton>
      </div>
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="danger"
          icon={<SuccessIcon />}
          showArrowRight
        >
          Danger
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="danger"
          className="w-72"
          icon={<SuccessIcon />}
          showArrowRight
          disabled
        >
          Danger: Disabled
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="danger"
          loading
          className="w-72"
          showArrowRight
          icon={<SuccessIcon />}
        >
          Danger: Loading
        </DecoratedButton>
      </div>
    </div>
  );
};
