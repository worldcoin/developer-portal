import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { SendIcon } from "@/components/Icons/SendIcon";
import { Toggle } from "@/components/Toggle";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { removeAppFromReview } from "@/scenes/Portal/Teams/TeamId/Apps/common/hooks/server";
import { yupResolver } from "@hookform/resolvers/yup";
import posthog from "posthog-js";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FetchAppMetadataDocument } from "../../graphql/client/fetch-app-metadata.generated";
import { submitAppForReviewFormServerSide } from "../server/submit";
import { SubmitSuccessToast } from "../SubmitSuccessToast";
import { useValidateLocalisationMutation } from "./graphql/client/validate-localisations.generated";

const schema = yup
  .object({
    is_developer_allow_listing: yup.boolean().default(false),
  })
  .noUnknown();

type SubmitAppModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  teamId: string;
  appId: string;
  appMetadataId: string;
  canSubmitAppStore: boolean;
  isDeveloperAllowListing: boolean;
};

export type SubmitAppFormValues = yup.InferType<typeof schema>;

export const SubmitAppModal = (props: SubmitAppModalProps) => {
  const {
    open,
    setOpen,
    teamId,
    appId,
    canSubmitAppStore,
    isDeveloperAllowListing,
    appMetadataId,
  } = props;

  const { refetch: refetchAppMetadata } = useRefetchQueries(
    FetchAppMetadataDocument,
    {
      id: appId,
    },
  );

  const [validateLocalisation, {}] = useValidateLocalisationMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubmitAppFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      is_developer_allow_listing: isDeveloperAllowListing,
    },
  });

  const isAllowListing = watch("is_developer_allow_listing");

  const submit = useCallback(
    async (values: SubmitAppFormValues) => {
      try {
        const { data } = await validateLocalisation({
          variables: {
            app_metadata_id: appMetadataId,
            team_id: teamId,
          },
          fetchPolicy: "network-only",
        });

        if (!data?.validate_localisation?.success) {
          toast.error("Localisation not set for all languages");
          return;
        }
      } catch (error) {
        console.error("Failed to validate localisation: ", error);
        toast.error("Failed to validate localisation");
        return;
      }

      if (values.is_developer_allow_listing && !canSubmitAppStore) {
        toast.error(
          "Featured and showcase images are required for listing in Mini Apps",
        );
        return;
      }

      const result = await submitAppForReviewFormServerSide({
        input: {
          app_metadata_id: appMetadataId,
          team_id: teamId,
          is_developer_allow_listing: values.is_developer_allow_listing,
          changelog: "", // No changelog in new design
        },
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      await refetchAppMetadata();

      posthog.capture("app_submitted_for_review", {
        app_id: appId,
        team_id: teamId,
        is_developer_allow_listing: values.is_developer_allow_listing,
      });

      toast.success(
        <SubmitSuccessToast
          onUndo={async () => {
            const result = await removeAppFromReview(appMetadataId);
            if (result.success) {
              await refetchAppMetadata();
            } else {
              toast.error(result.message);
            }
          }}
        />,
        {
          icon: false,
          closeButton: false,
        },
      );
      setOpen(false);
    },
    [
      appId,
      appMetadataId,
      canSubmitAppStore,
      refetchAppMetadata,
      setOpen,
      teamId,
      validateLocalisation,
    ],
  );

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogOverlay />
      <DialogPanel className="gap-y-6 md:max-w-[36rem]">
        <CircleIconContainer variant="info">
          <SendIcon className="text-blue-500" />
        </CircleIconContainer>
        <form className="grid gap-y-6" onSubmit={handleSubmit(submit)}>
          <div className="grid grid-cols-1 justify-items-center gap-y-3 text-center">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              Submit for review
            </Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-600">
              Submit your app for review to get the badge "Verified"
            </Typography>
          </div>

          <div className="grid gap-y-4 rounded-xl border border-grey-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
                    Display in the Worldcoin App Store
                  </Typography>
                  <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                    Optional
                  </Typography>
                </div>
                <Typography
                  variant={TYPOGRAPHY.R4}
                  className="text-grey-600 mt-1"
                >
                  If approved, your app can be featured in the Worldcoin App
                  Store
                </Typography>
              </div>
              <Toggle
                checked={isAllowListing}
                onChange={(checked) =>
                  setValue("is_developer_allow_listing", checked)
                }
              />
            </div>
          </div>

          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </DecoratedButton>
            <DecoratedButton type="submit">Submit app</DecoratedButton>
          </div>
        </form>
      </DialogPanel>
    </Dialog>
  );
};
