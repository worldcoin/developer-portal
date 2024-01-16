import { memo } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { FieldInput } from "../../actions/common/Form/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { ConfigurationFormValues } from "../Configuration";

interface AppLinksSectionProps {
  register: UseFormRegister<ConfigurationFormValues>; // Replace 'any' with the correct type for your register function
  errors: FieldErrors<ConfigurationFormValues>; // This assumes you are using react-hook-form
  isSubmitting: boolean;
}

export const AppLinksSection = memo(function AppLinksSection(
  props: AppLinksSectionProps
) {
  const { register, errors, isSubmitting } = props;
  return (
    <>
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
    </>
  );
});
