"use client";

import { CopyButton } from "@/components/CopyButton";
import {
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import {
  getSelfManagedRegistrationInfo,
  type SelfManagedRegistrationInfoResult,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/EnableWorldId40/SelfManagedRegistrationInfo/server";
import clsx from "clsx";
import { useEffect, useState } from "react";

type SelfManagedTransactionInfoContentProps = {
  appId: string;
  onBack: () => void;
  onComplete: () => void;
  completionLoading?: boolean;
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
  onBack,
  onComplete,
  completionLoading,
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

  if (loading) {
    return (
      <div
        className={clsx(
          "flex w-full items-center gap-x-3 py-8 font-world text-14 text-portal-muted",
          className,
        )}
      >
        <SpinnerIcon className="size-5 shrink-0 animate-spin" />
        Loading registration details…
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className={clsx("grid w-full gap-y-6", className)}>
        <p className="font-world text-14 leading-[1.5] text-system-error-600">
          {error ?? "Failed to load registration details"}
        </p>
        <div className="grid w-full gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onBack}
            className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => setRetryCount((v) => v + 1)}
            className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const rows = [
    {
      label: "RP ID",
      value: info.rpIdNumeric ?? FIELD_PLACEHOLDERS.rpId,
    },
    {
      label: "Production contract address",
      value:
        info.productionContractAddress ?? FIELD_PLACEHOLDERS.contractAddress,
    },
    {
      label: "Staging contract address",
      value:
        info.stagingContractAddress ??
        FIELD_PLACEHOLDERS.stagingContractAddress,
    },
    {
      label: "Chain ID",
      value: info.chainId ? String(info.chainId) : FIELD_PLACEHOLDERS.chainId,
    },
    {
      label: "Function to call",
      value: info.functionSignature ?? FIELD_PLACEHOLDERS.functionSignature,
    },
  ];

  return (
    <div className={clsx("grid w-full gap-y-6", className)}>
      <p className="font-world text-14 leading-[1.5] text-portal-muted">
        Register your Relying Party on-chain using these details.
      </p>

      <div className="grid gap-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex min-h-12 items-center justify-between gap-x-3 rounded-[10px] bg-portal-canvas px-4 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <span className="block font-world text-12 leading-[1.4] text-portal-muted">
                {row.label}
              </span>
              <span className="block font-world text-13 leading-[1.4] break-all text-portal-text">
                {row.value}
              </span>
            </div>
            <CopyButton
              fieldName={row.label}
              fieldValue={row.value}
              iconClassName="text-portal-muted"
            />
          </div>
        ))}
      </div>

      <div className="rounded-[10px] bg-system-warning-75 p-4">
        <p className="font-world text-13 leading-[1.4] font-medium text-system-warning-650">
          Staging warning
        </p>
        <p className="mt-0.5 font-world text-13 leading-[1.4] font-[350] text-system-warning-650">
          Register on BOTH production and staging if you want to use staging
          actions.
        </p>
      </div>

      <div className="grid w-full gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          disabled={completionLoading}
          className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={completionLoading}
          className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
        >
          {completionLoading ? (
            <SpinnerIcon className="size-5 animate-spin" />
          ) : (
            completeButtonLabel
          )}
        </button>
      </div>
    </div>
  );
};
