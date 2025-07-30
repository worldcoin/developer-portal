import { Checkbox } from "@/components/Checkbox";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { WorldcoinIcon } from "@/components/Icons/WorldcoinIcon";
import { TextArea } from "@/components/TextArea";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { appChangelogSchema } from "@/lib/schema";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import posthog from "posthog-js";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { FetchAppMetadataDocument } from "../../graphql/client/fetch-app-metadata.generated";
import { RemainingCharacters } from "../../PageComponents/RemainingCharacters";
import { validateAndSubmitAppForReviewFormServerSide } from "../server/submit";
import { useValidateLocalisationMutation } from "./graphql/client/validate-localisations.generated";

const schema = yup
  .object({
    is_developer_allow_listing: yup.boolean(),
    changelog: appChangelogSchema,
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
    formState: { errors },
  } = useForm<SubmitAppFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      is_developer_allow_listing: isDeveloperAllowListing,
      changelog: "",
    },
  });

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
      } catch (error: any) {
        console.error("Submit App Modal Failed: ", error);
        toast.error("Failed to submit app for review");
      }

      if (values.is_developer_allow_listing && !canSubmitAppStore) {
        toast.error(
          "Featured and showcase images are required for listing in Mini Apps",
        );
        return;
      }

      const result = await validateAndSubmitAppForReviewFormServerSide({
        input: {
          app_metadata_id: appMetadataId,
          team_id: teamId,
          is_developer_allow_listing: values.is_developer_allow_listing,
          changelog: values.changelog,
        },
      });
      if (!result.success) {
        console.error("Failed to submit app for review: ", result.message);
        toast.error(result.message);
        return;
      }

      await refetchAppMetadata();

      posthog.capture("app_submitted_for_review", {
        app_id: appId,
        team_id: teamId,
        is_developer_allow_listing: values.is_developer_allow_listing,
      });

      toast.success("App submitted for review");
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
      <DialogPanel className="gap-y-5 md:max-w-[36rem]">
        <CircleIconContainer variant={"info"}>
          <WorldcoinIcon className=" text-blue-500" />
        </CircleIconContainer>
        <form className="grid gap-y-10" onSubmit={handleSubmit(submit)}>
          <div className="grid grid-cols-1 justify-items-center gap-y-4">
            <Typography
              variant={TYPOGRAPHY.H6}
              className={clsx("text-grey-900")}
            >
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
                Allow listing in mini app store
              </Typography>
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-700">
                Checking this box means you would like your app to be available
                in the mini app store.
              </Typography>
            </div>
          </label>
          <TextArea
            label="Changelog"
            required
            rows={5}
            maxLength={1500}
            errors={errors.changelog}
            addOn={
              <RemainingCharacters text={watch("changelog")} maxChars={1500} />
            }
            placeholder="Let the reviewer know what's new in this version. Try to include paths to new features, changes, and bug fixes. This speeds reviews up."
            register={register("changelog")}
          />
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
