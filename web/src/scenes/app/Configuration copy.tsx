import React, { memo, useState, useEffect, useCallback } from "react";
import { useAppStore } from "src/stores/appStore";
import useApps from "src/hooks/useApps";
import { Dropdown } from "./Form/Dropdown";
import { Checkbox } from "src/components/Auth/Checkbox";

import { Button } from "@/components/Button";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { FieldInput } from "../actions/common/Form/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { toast } from "react-toastify";

const dropDownOptions = [
  { value: "Social", label: "Social" },
  { value: "Gaming", label: "Gaming" },
  { value: "Business", label: "Business" },
  { value: "Finance", label: "Finance" },
  { value: "Productivity", label: "Productivity" },
];

const saveSchema = yup.object().shape({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  description_internal: yup
    .string()
    .required("Internal description is required"),
  link: yup.string().url("Must be a valid URL").optional(),
  world_app_description: yup
    .string()
    .max(50, "In App description cannot exceed 50 characters")
    .optional(),
  category: yup.string().optional(),
  is_developer_allow_listing: yup.boolean().optional(),
});

const verificationSchema = yup.object().shape({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  description_internal: yup.string().required("App description is required"),
  link: yup
    .string()
    .url("Must be a valid URL")
    .required("App link is required"),
  world_app_description: yup
    .string()
    .required("World App description is required")
    .max(50, "In App description cannot exceed 50 characters"),
  category: yup.string().required("Category is required"),
  is_developer_allow_listing: yup.boolean().default(false),
});

type ConfigurationFormValues = yup.Asserts<typeof saveSchema>;
type VerificationFormValues = yup.Asserts<typeof verificationSchema>;
export const Configuration = memo(function Configuration() {
  const currentApp = useAppStore((store) => store.currentApp);
  const { updateAppData } = useApps();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfigurationFormValues>({
    resolver: yupResolver(saveSchema),
    defaultValues: { ...currentApp },
    resetOptions: { keepDefaultValues: true, keepDirtyValues: true },
  });

  // Form state
  const handleSave = useCallback(
    async (data: ConfigurationFormValues) => {
      console.log("here", data);
      // No need to validate here, react-hook-form does it for you
      await updateAppData(data);
      toast.success("App configuration saved");
    },
    [updateAppData]
  );

  // Verification handler
  const handleVerification = useCallback(
    async (data: VerificationFormValues) => {
      try {
        console.log("here");
        // Manually trigger verification schema validation
        await verificationSchema.validate(data);
        // Handle verification submission
      } catch (error) {
        console.log(error);
        // Handle validation errors
      }
    },
    []
  );
  const onSubmit = handleSubmit(async (data) => {
    console.log("here", data);
    await handleSave(data);
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-y-8">
      <h2 className="text-20 font-sora font-semibold">Configuration</h2>

      <div className="flex flex-col w-full">
        <FieldLabel className="mb-2 font-rubik">App name</FieldLabel>

        <div className="relative">
          <FieldInput
            register={register("name")}
            className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="App Name"
            type="text"
            maxChar={50}
            maxLength={50}
            disabled={isSubmitting}
            errors={errors.name}
          />

          {errors.name?.message && (
            <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
              {errors.name.message}
            </span>
          )}
        </div>
      </div>
      {/* <h1 className="font-bold">App Description</h1>
      <TextArea
        label="Overview"
        value={formData.description_internal}
        onChange={handleChange("description_internal")}
      />
      <TextArea
        label="How It Works"
        value={formData.description_internal}
        onChange={handleChange("description_internal")}
      />
      <TextArea
        label="How To Connect"
        value={formData.description_internal}
        onChange={handleChange("description_internal")}
      /> */}
      <div className="flex flex-col w-full">
        <FieldLabel className="mb-2 font-rubik">App Link</FieldLabel>

        <div className="relative">
          <FieldInput
            register={register("link")}
            className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="https://"
            type="text"
            disabled={isSubmitting}
            errors={errors.link}
          />

          {errors.link?.message && (
            <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
              {errors.link.message}
            </span>
          )}
        </div>
      </div>
      <div className="relative">
        <FieldLabel className="mb-2 font-rubik">
          World App Description
        </FieldLabel>
        {isSubmitting && "rip"}
        <FieldInput
          register={register("world_app_description")}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="In App Description"
          type="text"
          maxChar={50}
          maxLength={50}
          disabled={isSubmitting}
          errors={errors.world_app_description}
        />

        {errors.world_app_description?.message && (
          <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
            {errors.world_app_description.message}
          </span>
        )}
      </div>
      {/* <Dropdown
        label="Category"
        options={dropDownOptions}
        onChange={handleChange("category")}
        selectedValue={formData.category}
      />
     */}
      <Checkbox
        register={register("is_developer_allow_listing")}
        errors={errors.is_developer_allow_listing}
        className="font-rubik"
        label="Allow app to be listed on the app store"
        disabled={isSubmitting}
      />
      <div className="flex flex-row w-full justify-end h-10">
        <Button
          type="submit"
          variant="plain"
          className="px-3 mr-5"
          disabled={isSubmitting}
        >
          Save
        </Button>
        {/* <Button
          variant="primary"
          className="px-3"
          type="button"
          // onClick={handleSubmit(handleVerification)}
        >
          Submit for Verification
        </Button> */}
      </div>
    </form>
  );
});
