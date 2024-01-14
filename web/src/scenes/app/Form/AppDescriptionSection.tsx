import { memo } from "react";
import { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { FieldInput } from "../../actions/common/Form/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldTextArea } from "../../actions/common/Form/FieldTextArea";
import { ConfigurationFormValues } from "../Configuration";

interface AppDescriptionSectionProps {
  register: UseFormRegister<ConfigurationFormValues>; // Replace 'any' with the correct type for your register function
  errors: FieldErrors<ConfigurationFormValues>; // This assumes you are using react-hook-form
  disabled: boolean;
  watch: UseFormWatch<ConfigurationFormValues>;
}

export const AppDescriptionSection = memo(function AppDescriptionSection(
  props: AppDescriptionSectionProps
) {
  const { register, errors, disabled, watch } = props;
  console.log(errors);
  return (
    <>
      <h1 className="font-bold">App Description</h1>
      <div className="relative">
        <FieldLabel required className="mb-2 font-rubik">
          Overview
        </FieldLabel>

        <FieldTextArea
          value={watch("description_overview") ?? ""}
          maxChar={3500}
          disabled={disabled}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
          register={register("description_overview")}
          errors={errors.description_overview}
        />
        {errors.description_overview?.message && (
          <span className="pt-2 flex items-center text-12 text-danger">
            {errors.description_overview.message}
          </span>
        )}
      </div>
      <div>
        <FieldLabel required className="mb-2 font-rubik">
          How It Works
        </FieldLabel>
        <FieldTextArea
          value={watch("description_how_it_works")}
          maxChar={3500}
          disabled={disabled}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
          register={register("description_how_it_works")}
          errors={errors.description_how_it_works}
        />
        {errors.description_how_it_works?.message && (
          <span className="pt-2 flex items-center text-12 text-danger">
            {errors.description_how_it_works.message}
          </span>
        )}
      </div>
      <div>
        <FieldLabel required className="mb-2 font-rubik">
          How To Connect
        </FieldLabel>
        <FieldTextArea
          value={watch("description_connect")}
          maxChar={3500}
          disabled={disabled}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
          register={register("description_connect")}
          errors={errors.description_connect}
        />
        {errors.description_connect?.message && (
          <span className="pt-2flex items-center text-12 text-danger">
            {errors.description_connect.message}
          </span>
        )}
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
          disabled={disabled}
          errors={errors.world_app_description}
        />
        {errors.world_app_description?.message && (
          <span className="pt-2 flex items-center text-12 text-danger">
            {errors.world_app_description.message}
          </span>
        )}
      </div>
    </>
  );
});
