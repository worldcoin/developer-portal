import { Checkbox } from "@/components/Checkbox";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import posthog from "posthog-js";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FetchAppMetadataDocument } from "../../../graphql/client/fetch-app-metadata.generated";
import { useSubmitAppMutation } from "./graphql/client/submit-app.generated";

const schema = yup.object().shape({
  is_developer_allow_listing: yup.boolean(),
});

type SubmitAppModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  isDeveloperAllowListing: boolean;
  appMetadataId: string;
  teamId: string;
  appId: string;
  canSubmitAppStore: boolean;
};

export type SubmitAppFormValues = yup.Asserts<typeof schema>;

export const SubmitAppModal = (props: SubmitAppModalProps) => {
  const {
    open,
    setOpen,
    isDeveloperAllowListing,
    appMetadataId,
    teamId,
    appId,
    canSubmitAppStore,
  } = props;
  const [submitAppMutation, { loading: submittingApp }] =
    useSubmitAppMutation();

  const { register, handleSubmit } = useForm<SubmitAppFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      is_developer_allow_listing: isDeveloperAllowListing,
    },
  });

  const submit = useCallback(
    async (values: SubmitAppFormValues) => {
      if (submittingApp) return;
      try {
        if (values.is_developer_allow_listing && !canSubmitAppStore) {
          toast.error(
            "Featured and showcase images are required for an app store listing",
          );
          return;
        }
        await submitAppMutation({
          variables: {
            app_metadata_id: appMetadataId,
            is_developer_allow_listing:
              values?.is_developer_allow_listing ?? false,
            verification_status: "awaiting_review",
          },
          context: { headers: { team_id: teamId } },
          refetchQueries: [FetchAppMetadataDocument],
          awaitRefetchQueries: true,
        });

        posthog.capture("app_submitted_for_review", {
          app_id: appId,
          team_id: teamId,
          is_developer_allow_listing: values.is_developer_allow_listing,
        });

        toast.success("App submitted for review");
        setOpen(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to submit app for review");
      }
    },
    [
      appId,
      appMetadataId,
      canSubmitAppStore,
      setOpen,
      submitAppMutation,
      submittingApp,
      teamId,
    ],
  );

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogOverlay />
      <DialogPanel className="mx-5 max-w-[580px] gap-y-5">
        <CircleIconContainer variant={"info"}>
          <WorldcoinIcon className=" text-blue-500" />
        </CircleIconContainer>
        <form className="grid gap-y-10" onSubmit={handleSubmit(submit)}>
          <div className="grid grid-cols-1 justify-items-center gap-y-4">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              Submit for Review
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className="flex flex-col items-center justify-center text-grey-500 sm:flex-row"
            >
              Submit your app for review to get the{" "}
              <span className="flex items-center">
                <span className="mx-1.5 inline-flex items-center gap-x-1 rounded-xl bg-system-success-50 px-2 py-1 text-system-success-500">
                  <CheckmarkBadge className="w-4" />
                  <Typography
                    variant={TYPOGRAPHY.S3}
                    className="text-system-success-500"
                  >
                    Verified
                  </Typography>
                </span>{" "}
                badge
              </span>
            </Typography>
          </div>
          <label
            htmlFor="is_developer_allow_listing"
            className="grid cursor-pointer grid-cols-auto/1fr gap-x-4 rounded-xl border-[1px] border-grey-200 px-5 py-6"
          >
            <Checkbox
              id="is_developer_allow_listing"
              register={register("is_developer_allow_listing")}
            />
            <div className="grid gap-y-2">
              <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
                Allow App Store listing
              </Typography>
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
                Once you submit your app for review, it may be showcased in
                Worldcoin App Store. Not all apps will be displayed.
              </Typography>
            </div>
          </label>
          <div className="grid w-full grid-cols-2 gap-x-4">
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
