import { memo } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { FieldSelect } from "@/components/FieldSelect";
import { FieldLabel } from "src/components/FieldLabel";
import { ConfigurationFormValues } from "../Configuration";
import { FieldCheckbox } from "./FieldCheckbox";

interface AppPublicationSectionProps {
  register: UseFormRegister<ConfigurationFormValues>;
  errors: FieldErrors<ConfigurationFormValues>;
  isSubmitting: boolean;
}

const dropDownOptions = [
  { value: "Social", label: "Social" },
  { value: "Gaming", label: "Gaming" },
  { value: "Business", label: "Business" },
  { value: "Finance", label: "Finance" },
  { value: "Productivity", label: "Productivity" },
];
export const AppPublicationSection = memo(function AppPublicationSection(
  props: AppPublicationSectionProps
) {
  const { register, errors, isSubmitting } = props;
  return (
    <>
      <div>
        <FieldLabel required className="mb-2 font-rubik">
          Category
        </FieldLabel>
        <FieldSelect
          register={register("category")}
          label="category"
          options={dropDownOptions}
          errors={errors.category}
        />
        {errors.category?.message && (
          <span className="pt-2 left-0 flex items-center text-12 text-danger">
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
    </>
  );
});
