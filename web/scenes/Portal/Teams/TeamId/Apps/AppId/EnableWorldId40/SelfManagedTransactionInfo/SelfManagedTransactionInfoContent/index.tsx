"use client";

import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Notification } from "@/components/Notification";
import { WarningErrorIcon } from "@/components/Icons/WarningErrorIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import {
  getSelfManagedRegistrationInfo,
  type SelfManagedRegistrationInfoResult,
} from "../../SelfManagedRegistrationInfo/server";

type SelfManagedTransactionInfoContentProps = {
  appId: string;
  rpId: string;
  onBack: () => void;
  onComplete: () => void;
  title?: string;
  completeButtonLabel?: string;
  className?: string;
};

type SelfManagedInfo = {
  rpId: string | null;
  rpIdNumeric: string | null;
  chainId: number | null;
  productionContractAddress: string | null;
  stagingContractAddress: string | null;
  functionSignature: string | null;
};

const FIELD_PLACEHOLDERS = {
  rpId: "—",
  contractAddress: "0x...RpRegistry",
  stagingContractAddress: "—",
  chainId: "4808",
  functionSignature:
    "register(uint64 rpId, address manager, address signer, string domain)",
};

const withTimeout = async (
  appId: string,
  timeoutMs: number,
): Promise<SelfManagedRegistrationInfoResult> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Request timeout"));
    }, timeoutMs);

    getSelfManagedRegistrationInfo(appId)
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export const SelfManagedTransactionInfoContent = ({
  appId,
  rpId,
  onBack,
  onComplete,
  title = "Self-Managed Registration",
  completeButtonLabel = "Continue",
  className,
}: SelfManagedTransactionInfoContentProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<SelfManagedInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await withTimeout(appId, 30000);

        if (!result.success) {
          if (isMounted) setError(result.message);
          return;
        }

        if (isMounted) {
          setInfo({
            rpId: result.rpId ?? null,
            rpIdNumeric: result.rpIdNumeric ?? null,
            chainId: result.chainId ?? null,
            productionContractAddress: result.productionContractAddress ?? null,
            stagingContractAddress: result.stagingContractAddress,
            functionSignature: result.functionSignature ?? null,
          });
        }
      } catch (fetchError) {
        if (isMounted) {
          if (
            fetchError instanceof Error &&
            fetchError.message === "Request timeout"
          ) {
            setError(
              "Request timed out while loading registration details. Check network/RPC access and try again.",
            );
            return;
          }
          const message =
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to load registration details";
          setError(message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInfo();

    return () => {
      isMounted = false;
    };
  }, [appId, retryCount]);

  const resolvedRpId = useMemo(
    () => info?.rpIdNumeric ?? rpId ?? FIELD_PLACEHOLDERS.rpId,
    [info?.rpIdNumeric, rpId],
  );
  const productionContractAddress =
    info?.productionContractAddress ?? FIELD_PLACEHOLDERS.contractAddress;
  const stagingContractAddress =
    info?.stagingContractAddress ?? FIELD_PLACEHOLDERS.stagingContractAddress;
  const chainId = info?.chainId
    ? String(info.chainId)
    : FIELD_PLACEHOLDERS.chainId;
  const functionSignature =
    info?.functionSignature ?? FIELD_PLACEHOLDERS.functionSignature;

  if (loading) {
    return (
      <div className={clsx("grid w-full max-w-[580px] gap-y-4", className)}>
        <Typography variant={TYPOGRAPHY.H6}>{title}</Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Loading registration details...
        </Typography>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className={clsx("grid w-full max-w-[580px] gap-y-6", className)}>
        <Typography variant={TYPOGRAPHY.H6}>{title}</Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-system-error-500">
          {error ?? "Failed to load registration details"}
        </Typography>
        <div className="flex justify-end gap-x-3">
          <DecoratedButton
            type="button"
            onClick={() => setRetryCount((v) => v + 1)}
            variant="secondary"
          >
            Retry
          </DecoratedButton>
          <DecoratedButton type="button" onClick={onBack} variant="secondary">
            Go Back
          </DecoratedButton>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("grid w-full max-w-[580px] gap-y-8", className)}>
      <div className="grid gap-y-1">
        <Typography variant={TYPOGRAPHY.H6}>{title}</Typography>
      </div>

      <div className="grid gap-y-5">
        <div className="flex min-h-14 items-center justify-between gap-x-2 rounded-[10px] bg-grey-50 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Typography
              variant={TYPOGRAPHY.B4}
              className="block leading-tight text-grey-500"
            >
              RP ID
            </Typography>
            <Typography
              variant={TYPOGRAPHY.B3}
              className="block truncate leading-tight text-grey-400"
            >
              {resolvedRpId}
            </Typography>
          </div>
          <CopyButton
            fieldName="RP ID"
            fieldValue={resolvedRpId}
            iconClassName="text-grey-500"
          />
        </div>

        <div className="flex min-h-14 items-center justify-between gap-x-2 rounded-[10px] bg-grey-50 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Typography
              variant={TYPOGRAPHY.B4}
              className="block leading-tight text-grey-500"
            >
              Production contract address
            </Typography>
            <Typography
              variant={TYPOGRAPHY.B3}
              className="block truncate leading-tight text-grey-400"
            >
              {productionContractAddress}
            </Typography>
          </div>
          <CopyButton
            fieldName="Production contract address"
            fieldValue={productionContractAddress}
            iconClassName="text-grey-500"
          />
        </div>

        <div className="flex min-h-14 items-center justify-between gap-x-2 rounded-[10px] bg-grey-50 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Typography
              variant={TYPOGRAPHY.B4}
              className="block leading-tight text-grey-500"
            >
              Staging contract address
            </Typography>
            <Typography
              variant={TYPOGRAPHY.B3}
              className="block truncate leading-tight text-grey-400"
            >
              {stagingContractAddress}
            </Typography>
          </div>
          <CopyButton
            fieldName="Staging contract address"
            fieldValue={stagingContractAddress}
            iconClassName="text-grey-500"
          />
        </div>

        <div className="flex min-h-14 items-center justify-between gap-x-2 rounded-[10px] bg-grey-50 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Typography
              variant={TYPOGRAPHY.B4}
              className="block leading-tight text-grey-500"
            >
              Chain ID
            </Typography>
            <Typography
              variant={TYPOGRAPHY.B3}
              className="block leading-tight text-grey-400"
            >
              {chainId}
            </Typography>
          </div>
          <CopyButton
            fieldName="Chain ID"
            fieldValue={chainId}
            iconClassName="text-grey-500"
          />
        </div>

        <div className="flex min-h-14 items-center justify-between gap-x-2 rounded-[10px] bg-grey-50 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Typography
              variant={TYPOGRAPHY.B4}
              className="block leading-tight text-grey-500"
            >
              Function to call
            </Typography>
            <Typography
              variant={TYPOGRAPHY.B3}
              className="block truncate leading-tight text-grey-400"
            >
              {functionSignature}
            </Typography>
          </div>
          <CopyButton
            fieldName="Function to call"
            fieldValue={functionSignature}
            iconClassName="text-grey-500"
          />
        </div>
      </div>

      <Notification
        variant="warning"
        className="min-h-[72px] rounded-[10px] border-none bg-system-warning-75"
        iconClassName="bg-system-warning-650"
        icon={<WarningErrorIcon className="size-4 text-grey-0" />}
      >
        <div className="grid gap-y-0.5 text-system-warning-650">
          <Typography variant={TYPOGRAPHY.S4}>Staging warning:</Typography>
          <Typography variant={TYPOGRAPHY.S4}>
            Register on BOTH production and staging if you want to use staging
            actions.
          </Typography>
        </div>
      </Notification>

      <div className="flex justify-end gap-x-4 pt-1">
        <DecoratedButton type="button" onClick={onBack} variant="secondary">
          Back
        </DecoratedButton>
        <DecoratedButton type="button" onClick={onComplete} variant="primary">
          {completeButtonLabel}
        </DecoratedButton>
      </div>
    </div>
  );
};
