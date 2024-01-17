import React, { memo, useCallback } from "react";
import { useAppStore } from "src/stores/appStore";
import useApps from "src/hooks/useApps";
import { Button } from "@/components/Button";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FieldInput } from "../actions/common/Form/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { AppLinksSection } from "./Form/AppLinksSection";
import { AppDescriptionSection } from "./Form/AppDescriptionSection";
import { AppPublicationSection } from "./Form/AppPublicationSection";
import { AppImageUploadSection } from "./Form/AppImageUploadSection";

const saveSchema = yup.object().shape({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  description_overview: yup
    .string()
    .max(1500)
    .required("This section is required"),
  description_how_it_works: yup.string().max(1500).optional(),
  description_connect: yup.string().max(1500).optional(),
  world_app_description: yup.string().max(50).optional(),
  logo_img_url: yup.string().optional(),
  integration_url: yup
    .string()
    .url("Must be a valid URL")
    .matches(/^https:\/\/|^$/, "Link must start with https://")
    .optional(),
  app_website_url: yup
    .string()
    .url("Must be a valid URL")
    .matches(/^https:\/\/|^$/, "Link must start with https://")
    .optional(),
  source_code_url: yup
    .string()
    .url("Must be a valid URL")
    .matches(/^https:\/\/|^$/, "Link must start with https://")
    .optional(),
  category: yup.string().optional(),
  is_developer_allow_listing: yup.boolean(),
  verification_status: yup.string().default("unverified"),
});

const submitSchema = yup.object().shape({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  description_overview: yup
    .string()
    .max(1500)
    .required("This section is required"),
  description_how_it_works: yup
    .string()
    .max(1500)
    .required("This section is required"),
  description_connect: yup
    .string()
    .max(1500)
    .required("This section is required"),
  world_app_description: yup
    .string()
    .max(50)
    .required("This section is required"),
  logo_img_url: yup.string().required("This section is required"),
  integration_url: yup
    .string()
    .url("Must be a valid URL")
    .matches(/^https:\/\/|^$/, "Link must start with https://")
    .required("This section is required"),
  app_website_url: yup
    .string()
    .url("Must be a valid URL")
    .matches(/^https:\/\/|^$/, "Link must start with https://")
    .optional(),
  source_code_url: yup
    .string()
    .url("Must be a valid URL")
    .matches(/^https:\/\/|^$/, "Link must start with https://")
    .optional(),
  category: yup.string().required("This section is required"),
  is_developer_allow_listing: yup.boolean(),
});

export type ConfigurationFormValues = yup.Asserts<typeof saveSchema>;
export type ConfigurationFormSubmitValues = yup.Asserts<typeof submitSchema>;

export const Configuration = memo(function Configuration() {
  const currentApp = useAppStore((store) => store.currentApp);
  const { updateAppMetadata, parseDescription, encodeDescription } = useApps();
  // In the edge case that the app has no metadata we allow the user to create new metadata
  const isEditable =
    currentApp?.app_metadata?.verification_status === "unverified" ||
    !currentApp?.app_metadata;

  const description = parseDescription(currentApp?.app_metadata);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ConfigurationFormValues>({
    resolver: yupResolver(saveSchema),
    defaultValues: { ...currentApp?.app_metadata, ...description },
    values: { ...currentApp?.app_metadata, ...description },
  });

  const prepareMetadataForSave = useCallback(
    (data: ConfigurationFormValues) => {
      const {
        description_overview,
        description_how_it_works,
        description_connect,
        ...rest
      } = data;
      const descriptionsJSON = encodeDescription(
        description_overview,
        description_how_it_works ?? "",
        description_connect ?? ""
      );
      return {
        ...rest,
        description: descriptionsJSON,
      };
    },
    [encodeDescription]
  );

  const handleSave = useCallback(
    async (data: ConfigurationFormValues) => {
      const updatedData = prepareMetadataForSave(data);
      console.log(updatedData);
      await updateAppMetadata({
        ...updatedData,
        verification_status: "unverified",
      });

      toast.success("App information saved");
    },
    [prepareMetadataForSave, updateAppMetadata]
  );

  const handleSubmitForReview = useCallback(
    async (data: ConfigurationFormValues) => {
      try {
        if (currentApp?.app_metadata?.verification_status !== "unverified") {
          throw new Error("You must un-submit your app to submit again");
        }
        await submitSchema.validate(data, { abortEarly: false });
        const updatedData = prepareMetadataForSave(data);
        await updateAppMetadata({
          ...updatedData,
          verification_status: "awaiting_review",
        });

        toast.success("App submitted for review");
      } catch (validationErrors: any) {
        toast.error("Error submitting for review. Please check your inputs");
        if (validationErrors.inner && Array.isArray(validationErrors.inner)) {
          validationErrors.inner.forEach((error: yup.ValidationError) => {
            setError(error.path as keyof ConfigurationFormValues, {
              type: "manual",
              message: error.message,
            });
          });
        }
      }
    },
    [prepareMetadataForSave, updateAppMetadata, setError, currentApp]
  );

  const removeFromReview = useCallback(
    async (_: ConfigurationFormValues) => {
      try {
        if (
          !currentApp ||
          ["verified", "unverified"].includes(
            currentApp?.app_metadata?.verification_status
          )
        ) {
          throw new Error("You cannot remove an app that is not in review");
        }
        await updateAppMetadata({ verification_status: "unverified" });
        toast.success("App removed from review");
      } catch (validationErrors: any) {
        toast.error("Error removing from review. Please check your inputs");
      }
    },
    [currentApp, updateAppMetadata]
  );

  const editVerifiedApp = useCallback(
    async (_: ConfigurationFormValues) => {
      try {
        if (
          !currentApp ||
          currentApp?.app_metadata?.verification_status !== "verified"
        ) {
          throw new Error("Your app must be already verified for this action");
        }
        await updateAppMetadata({
          ...currentApp?.app_metadata,
          verification_status: "unverified",
        });
        toast.success("New app draft created");
      } catch (validationErrors: any) {
        toast.error("Error creating a new draft.");
      }
    },
    [currentApp, updateAppMetadata]
  );

  return (
    <form onSubmit={handleSubmit(handleSave)} className="grid gap-y-8">
      {Object.keys(dirtyFields).length > 0 && (
        <div className="text-danger ">
          Warning: You have unsaved changes to your app information!
        </div>
      )}
      <h2 className="text-20 font-sora font-semibold">App Information</h2>
      <AppImageUploadSection
        register={register}
        errors={errors}
        disabled={isSubmitting || !isEditable}
        setValue={setValue}
      />
      <div className="flex flex-col w-full">
        <FieldLabel required className="mb-2 font-rubik">
          App name
        </FieldLabel>
        <div className="relative">
          <FieldInput
            register={register("name")}
            className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="App Name"
            value={watch("name")}
            maxChar={50}
            maxLength={50}
            disabled={isSubmitting || !isEditable}
            required
            errors={errors.name}
          />

          {errors.name?.message && (
            <span className="pt-2 left-0 flex items-center text-12 text-danger">
              {errors.name.message}
            </span>
          )}
        </div>
      </div>
      <AppDescriptionSection
        register={register}
        errors={errors}
        disabled={isSubmitting || !isEditable}
        watch={watch}
      />
      <AppLinksSection
        register={register}
        errors={errors}
        disabled={isSubmitting || !isEditable}
      />
      <AppPublicationSection
        register={register}
        errors={errors}
        disabled={isSubmitting || !isEditable}
      />
      <div className="flex flex-row w-full justify-end h-10">
        <Button
          type="submit"
          variant="secondary"
          className="px-3 mr-5"
          disabled={isSubmitting || !isEditable}
        >
          Save Information
        </Button>
        {isEditable ? (
          <Button
            type="button"
            variant="primary"
            className="px-3 mr-5"
            disabled={isSubmitting || !isEditable}
            onClick={() => handleSubmit(handleSubmitForReview)()}
          >
            Submit for Review
          </Button>
        ) : currentApp?.app_metadata?.verification_status === "verified" ? (
          <Button
            type="button"
            variant="primary"
            className="px-3 mr-5"
            disabled={isSubmitting || isEditable}
            onClick={() => handleSubmit(editVerifiedApp)()}
          >
            Create New Draft
          </Button>
        ) : (
          <Button
            type="button"
            variant="danger"
            className="px-3 mr-5"
            disabled={isSubmitting || isEditable}
            onClick={() => handleSubmit(removeFromReview)()}
          >
            Remove from Review
          </Button>
        )}
      </div>
    </form>
  );
});
