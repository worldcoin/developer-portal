import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { ReactNode, useMemo, useState } from "react";
import { AffiliateMetadataResponse, ParticipationStatus } from "@/lib/types";
import { requestParticipation } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/requestAffiliateRequest";
import { toast } from "react-toastify";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { ArrowDownSharpIcon } from "@/components/Icons/ArrowDownSharp";
import { NoteEditIcon } from "@/components/Icons/NoteEditIcon";
import { CheckIcon } from "@/components/Icons/CheckIcon";

type StepConfig = {
  icon?: ReactNode;
  title: string;
  description?: string;
  buttonTxt?: string;
  onClick?: () => void;
  loading?: boolean;
};

type Props = {
  metadata: AffiliateMetadataResponse["result"];
  onComplete: () => void;
};

export const RequestStep = ({ metadata, onComplete }: Props) => {
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const requestConfig: StepConfig | null = useMemo(() => {
    if (!metadata) return null;

    const status = metadata.participationStatus;
    const defaultConfig = {
      icon: (
        <IconFrame className="flex-shrink-0 bg-blue-500 text-grey-0">
          <NoteEditIcon className="size-5" />
        </IconFrame>
      ),
    };

    if (status === ParticipationStatus.APPROVED) {
      return {
        ...defaultConfig,
        icon: (
          <IconFrame className="flex-shrink-0 bg-system-success-50 text-system-success-500">
            <CheckIcon size="16" />
          </IconFrame>
        ),
        title: "Request approved",
      };
    }

    if (status === ParticipationStatus.PENDING) {
      return {
        ...defaultConfig,
        title: "Request in review",
        description: "It will take up to 48 hours",
        loading: true,
      };
    }

    if (status === ParticipationStatus.REJECTED) {
      return {
        ...defaultConfig,
        icon: (
          <IconFrame className="flex-shrink-0 bg-system-error-50 text-system-error-500">
            <RemoveCustomIcon className="size-5" />
          </IconFrame>
        ),
        title: "Request denied",
        description: "Try to send request again",
        buttonTxt: "Try again",
      };
    }

    // fallback for NOT_REQUESTED status
    return {
      ...defaultConfig,
      title: "Request to become affiliate",
      buttonTxt: "Request",
    };
  }, [metadata]);

  const handleRequestAccess = async () => {
    if (!metadata) return;

    setIsRequestLoading(true);

    try {
      const result = await requestParticipation();
      console.log("requestParticipation: ", result);

      if (result.success && result.data) {
        onComplete();
      } else {
        throw new Error(result.message || "Failed to request participation");
      }
    } catch (error) {
      console.error("Failed to request participation:", error);
      toast.error("Failed to request participation. Please try again.");
    } finally {
      setIsRequestLoading(false);
    }
  };

  return (
    <>
      {requestConfig?.icon}

      <div className="text-start">
        <Typography as="p" variant={TYPOGRAPHY.M3}>
          {requestConfig?.title}
        </Typography>
        <Typography as="p" variant={TYPOGRAPHY.R5} className="text-grey-500">
          {requestConfig?.description}
        </Typography>
      </div>

      {requestConfig?.buttonTxt &&
        (isRequestLoading ||
        metadata?.participationStatus === ParticipationStatus.PENDING ? (
          <SpinnerIcon className="ml-auto size-6 animate-spin" />
        ) : (
          <>
            <Button
              type="button"
              onClick={handleRequestAccess}
              className="ml-auto flex size-6 items-center justify-center rounded-full bg-grey-900 md:hidden"
            >
              <ArrowDownSharpIcon className="size-3 text-grey-0" />
            </Button>
            <DecoratedButton
              type="button"
              onClick={handleRequestAccess}
              className="ml-auto hidden max-h-9 md:flex"
            >
              {requestConfig?.buttonTxt}
            </DecoratedButton>
          </>
        ))}
    </>
  );
};
