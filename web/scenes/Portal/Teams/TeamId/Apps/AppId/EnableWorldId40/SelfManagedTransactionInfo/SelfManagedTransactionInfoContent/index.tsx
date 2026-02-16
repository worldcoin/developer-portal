"use client";

import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Notification } from "@/components/Notification";
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
  className?: string;
};

type SelfManagedInfo = {
  rpId: string;
  rpIdNumeric: string;
  chainId: number;
  productionContractAddress: string;
  stagingContractAddress: string | null;
  functionSignature: string;
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
  className,
}: SelfManagedTransactionInfoContentProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<SelfManagedInfo | null>(null);

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

        if (
          !result.productionContractAddress ||
          !result.functionSignature ||
          !result.rpIdNumeric
        ) {
          if (isMounted) setError("Missing required registration details");
          return;
        }

        if (isMounted) {
          setInfo({
            rpId: result.rpId,
            rpIdNumeric: result.rpIdNumeric,
            chainId: result.chainId,
            productionContractAddress: result.productionContractAddress,
            stagingContractAddress: result.stagingContractAddress,
            functionSignature: result.functionSignature,
          });
        }
      } catch (fetchError) {
        if (isMounted) {
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
  }, [appId]);

  const resolvedRpId = useMemo(() => info?.rpId ?? rpId, [info?.rpId, rpId]);

  if (loading) {
    return (
      <div className={clsx("grid w-full max-w-[580px] gap-y-4", className)}>
        <Typography variant={TYPOGRAPHY.H6}>
          Self-Managed Registration
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Loading registration details...
        </Typography>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className={clsx("grid w-full max-w-[580px] gap-y-6", className)}>
        <Typography variant={TYPOGRAPHY.H6}>
          Self-Managed Registration
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-system-error-500">
          {error ?? "Failed to load registration details"}
        </Typography>
        <div className="flex justify-end">
          <DecoratedButton type="button" onClick={onBack} variant="secondary">
            Go Back
          </DecoratedButton>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("grid w-full max-w-[580px] gap-y-6", className)}>
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6}>
          Self-Managed Registration
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Use the details below to submit the on-chain registration transaction.
        </Typography>
      </div>

      <div className="grid gap-y-4 rounded-xl border border-grey-100 p-5">
        <div className="flex items-center justify-between gap-x-4">
          <div className="min-w-0">
            <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
              Contract Address
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className="break-all font-mono text-grey-900"
            >
              {info.productionContractAddress}
            </Typography>
          </div>
          <CopyButton
            fieldName="Contract Address"
            fieldValue={info.productionContractAddress}
          />
        </div>

        {info.stagingContractAddress && (
          <div className="flex items-center justify-between gap-x-4">
            <div className="min-w-0">
              <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
                Staging Contract Address
              </Typography>
              <Typography
                variant={TYPOGRAPHY.R3}
                className="break-all font-mono text-grey-900"
              >
                {info.stagingContractAddress}
              </Typography>
            </div>
            <CopyButton
              fieldName="Staging Contract Address"
              fieldValue={info.stagingContractAddress}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-x-4">
          <div className="min-w-0">
            <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
              RP ID
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className="break-all font-mono text-grey-900"
            >
              {resolvedRpId}
            </Typography>
          </div>
          <CopyButton fieldName="RP ID" fieldValue={resolvedRpId} />
        </div>

        <div className="flex items-center justify-between gap-x-4">
          <div className="min-w-0">
            <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
              RP ID Numeric
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className="break-all font-mono text-grey-900"
            >
              {info.rpIdNumeric}
            </Typography>
          </div>
          <CopyButton fieldName="RP ID Numeric" fieldValue={info.rpIdNumeric} />
        </div>

        <div className="flex items-center justify-between gap-x-4">
          <div className="min-w-0">
            <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
              Function Signature
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className="break-all font-mono text-grey-900"
            >
              {info.functionSignature}
            </Typography>
          </div>
          <CopyButton
            fieldName="Function Signature"
            fieldValue={info.functionSignature}
          />
        </div>
      </div>

      <Notification variant="info">
        <div className="grid gap-y-1 text-blue-800">
          <Typography variant={TYPOGRAPHY.S3}>Next step</Typography>
          <Typography variant={TYPOGRAPHY.S4}>
            Submit the registration transaction on chain and then return to this
            app. Chain ID: {info.chainId}.
          </Typography>
        </div>
      </Notification>

      <div className="flex justify-between gap-x-4">
        <DecoratedButton type="button" onClick={onBack} variant="secondary">
          Back
        </DecoratedButton>
        <DecoratedButton type="button" onClick={onComplete} variant="primary">
          Done
        </DecoratedButton>
      </div>
    </div>
  );
};
