import React, { memo, useState, useEffect, useCallback } from "react";
import { useAppStore } from "src/stores/appStore";
import useApps from "src/hooks/useApps";
import { Checkbox } from "src/components/Auth/Checkbox";

import { Button } from "@/components/Button";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { FieldInput } from "../actions/common/Form/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { toast } from "react-toastify";
import { FieldSelect } from "@/components/FieldSelect";
import { FieldTextarea } from "./Form/TextArea";

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
  description_overview: yup
    .string()
    .max(3500)
    .required("This section is required"),
  description_how_it_works: yup.string().max(3500).notRequired(),
  description_connect: yup.string().max(3500).notRequired(),
  link: yup.string().url("Must be a valid URL").notRequired(),
  world_app_description: yup
    .string()
    .max(50, "In App description cannot exceed 50 characters")
    .notRequired(),
  category: yup.string().default("").notRequired(),
  is_developer_allow_listing: yup.boolean().default(false),
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
  const { updateAppData, parseDescription, encodeDescription } = useApps();

  const descriptionInternal = parseDescription(currentApp);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConfigurationFormValues>({
    resolver: yupResolver(saveSchema),
    defaultValues: { ...currentApp, ...descriptionInternal },
    values: { ...currentApp, ...descriptionInternal },
  });

  const watchTextInputs = watch([
    "name",
    "world_app_description",
    "description_overview",
    "description_how_it_works",
    "description_connect",
  ]);

  const handleSave = useCallback(
    async (data: ConfigurationFormValues) => {
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

      const updatedData = {
        ...rest,
        description_internal: descriptionsJSON,
      };
      await updateAppData(updatedData);
      toast.success("App configuration saved");
    },
    [encodeDescription, updateAppData]
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

  return (
    <form onSubmit={handleSubmit(handleSave)} className="grid gap-y-8">
      <h2 className="text-20 font-sora font-semibold">App Details</h2>

      <div className="flex flex-col w-full">
        <FieldLabel required className="mb-2 font-rubik">
          App name
        </FieldLabel>

        <div className="relative">
          <FieldInput
            register={register("name")}
            className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="App Name"
            type="text"
            maxChar={50}
            maxLength={50}
            value={watchTextInputs[0] ?? ""}
            disabled={isSubmitting}
            required
            errors={errors.name}
          />

          {errors.name?.message && (
            <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
              {errors.name.message}
            </span>
          )}
        </div>
      </div>
      <h1 className="font-bold">App Description</h1>
      <div className="relative">
        <FieldLabel required className="mb-2 font-rubik">
          Overview
        </FieldLabel>

        <FieldTextarea
          value={watchTextInputs[2] ?? ""}
          maxChar={3500}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
          register={register("description_overview")}
        />
        {errors.description_overview?.message && (
          <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
            {errors.description_overview.message}
          </span>
        )}
      </div>
      <div>
        <FieldLabel required className="mb-2 font-rubik">
          How It Works
        </FieldLabel>
        <FieldTextarea
          value={watchTextInputs[3] ?? ""}
          maxChar={3500}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
          register={register("description_how_it_works")}
        />
        {errors.description_how_it_works?.message && (
          <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
            {errors.description_how_it_works.message}
          </span>
        )}
      </div>
      <div>
        <FieldLabel required className="mb-2 font-rubik">
          How To Connect
        </FieldLabel>
        <FieldTextarea
          value={watchTextInputs[3] ?? ""}
          maxChar={3500}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
          register={register("description_connect")}
        />
        {errors.description_connect?.message && (
          <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
            {errors.description_connect.message}
          </span>
        )}
      </div>
      <div className="flex flex-col w-full">
        <FieldLabel required className="mb-2 font-rubik">
          App Link
        </FieldLabel>

        <div className="relative">
          <FieldInput
            register={register("link", { required: false })}
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
        <FieldLabel required className="mb-2 font-rubik">
          World App Description
        </FieldLabel>
        <FieldInput
          register={register("world_app_description")}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="In App Description"
          type="text"
          value={watchTextInputs[1] ?? ""}
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
      <div>
        <FieldLabel required className="mb-2 font-rubik">
          Category
        </FieldLabel>
        <FieldSelect
          register={register("category")}
          label="category"
          value="category"
          options={dropDownOptions}
          errors={errors.category}
        />
        {errors.category?.message && (
          <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
            {errors.category.message}
          </span>
        )}
      </div>

      <Checkbox
        register={register("is_developer_allow_listing")}
        errors={errors.is_developer_allow_listing}
        className="font-rubik"
        label="Allow app to be listed on the app store"
        disabled={isSubmitting}
        alternativeColor="text-primary"
      />
      <div className="flex flex-row w-full justify-end h-10">
        <Button type="submit" variant="plain" className="px-3 mr-5">
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
