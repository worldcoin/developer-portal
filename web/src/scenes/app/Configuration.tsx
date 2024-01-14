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
import { FieldSelect } from "@/components/FieldSelect";
import { FieldTextArea } from "../actions/common/Form/FieldTextArea";
import { FieldCheckbox } from "./Form/FieldCheckbox";

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
  description_how_it_works: yup.string().max(3500).optional(),
  description_connect: yup.string().max(3500).optional(),
  world_app_description: yup
    .string()
    .max(50, "In app description cannot exceed 50 characters")
    .optional(),
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
  category: yup.string().default("").optional(),
  is_developer_allow_listing: yup.boolean().default(false),
});

type ConfigurationFormValues = yup.Asserts<typeof saveSchema>;

export const Configuration = memo(function Configuration() {
  const currentApp = useAppStore((store) => store.currentApp);
  const { updateAppMetadata, parseDescription, encodeDescription } = useApps();

  const descriptionInternal = parseDescription(currentApp?.app_metadata);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ConfigurationFormValues>({
    resolver: yupResolver(saveSchema),
    defaultValues: { ...currentApp?.app_metadata, ...descriptionInternal },
    values: { ...currentApp?.app_metadata, ...descriptionInternal },
  });

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
        description: descriptionsJSON,
      };
      console.log(updatedData);
      await updateAppMetadata(updatedData);
      toast.success("App information saved");
    },
    [encodeDescription, updateAppMetadata]
  );

  return (
    <form onSubmit={handleSubmit(handleSave)} className="grid gap-y-8">
      {Object.keys(dirtyFields).length > 0 && (
        <div className="text-danger ">
          Warning: You have unsaved changes to your app information!
        </div>
      )}
      <h2 className="text-20 font-sora font-semibold">App Information</h2>
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

        <FieldTextArea
          value={watch("description_overview") ?? ""}
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
        <FieldTextArea
          value={watch("description_how_it_works") ?? ""}
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
        <FieldTextArea
          value={watch("description_connect") ?? ""}
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
          Use Integration Link
        </FieldLabel>

        <div className="relative">
          <FieldInput
            register={register("integration_url")}
            className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="https://"
            disabled={isSubmitting}
            errors={errors.integration_url}
          />

          {errors.integration_url?.message && (
            <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
              {errors.integration_url.message}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col w-full">
        <FieldLabel required className="mb-2 font-rubik">
          Source Code Link:
        </FieldLabel>

        <div className="relative">
          <FieldInput
            register={register("source_code_url")}
            className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="https://"
            disabled={isSubmitting}
            errors={errors.source_code_url}
          />

          {errors.source_code_url?.message && (
            <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
              {errors.source_code_url.message}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col w-full">
        <FieldLabel required className="mb-2 font-rubik">
          App Website Link
        </FieldLabel>

        <div className="relative">
          <FieldInput
            register={register("app_website_url")}
            className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="https://"
            disabled={isSubmitting}
            errors={errors.app_website_url}
          />

          {errors.app_website_url?.message && (
            <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
              {errors.app_website_url.message}
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
          placeholder="Description shown inside of World App"
          value={watch("world_app_description") ?? ""}
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
          value=""
          options={dropDownOptions}
          errors={errors.category}
        />
        {errors.category?.message && (
          <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
            {errors.category.message}
          </span>
        )}
      </div>

      <FieldCheckbox
        register={register("is_developer_allow_listing")}
        errors={errors.is_developer_allow_listing}
        className="font-rubik"
        label="Allow app to be listed on the app store"
        disabled={isSubmitting}
      />
      <div className="flex flex-row w-full justify-end h-10">
        <Button type="submit" variant="primary" className="px-3 mr-5">
          Save Information
        </Button>
      </div>
    </form>
  );
});
