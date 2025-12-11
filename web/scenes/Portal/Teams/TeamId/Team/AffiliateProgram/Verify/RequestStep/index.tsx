import { ReactNode, useMemo, useState } from "react";
import { AffiliateMetadataResponse, ParticipationStatus } from "@/lib/types";
import { requestParticipation } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/requestAffiliateRequest";
import { toast } from "react-toastify";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { NoteEditIcon } from "@/components/Icons/NoteEditIcon";
import { CheckIcon } from "@/components/Icons/CheckIcon";
import { Step } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Verify/Step";

type StepConfig = {
  icon?: ReactNode;
  title: string;
  description?: string;
  buttonTxt?: string;
  onClick?: () => void;
  loading?: boolean;
};

type Props = {
  metadata: AffiliateMetadataResponse["result"] | null;
  onComplete: () => void;
};

export const RequestStep = ({ metadata, onComplete }: Props) => {
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const stepConfig: StepConfig | null = useMemo(() => {
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
        description: "Check back later",
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
    if (!metadata || isRequestLoading) return;

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
      <Step
        icon={stepConfig?.icon}
        title={stepConfig?.title}
        description={stepConfig?.description}
        buttonText={stepConfig?.buttonTxt}
        showButtonSpinner={stepConfig?.loading || isRequestLoading}
        loading={!stepConfig}
        onClick={handleRequestAccess}
      />
    </>
  );
};
