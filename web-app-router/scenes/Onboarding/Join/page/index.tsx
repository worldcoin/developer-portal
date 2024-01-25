"use client";

import {
  CircleIconContainer,
  CircleIconContainerProps,
} from "@/components/CircleIconContainer";

import { AlertIcon } from "@/components/icons/AlertIcon";
import { useEffect, useState } from "react";

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
    <div>
      <CircleIconContainer variant={variant}>
        <AlertIcon />
      </CircleIconContainer>
    </div>
  );
};
