import { memo } from "react";
import { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
import { FieldInput } from "../../actions/common/Form/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldTextArea } from "../../actions/common/Form/FieldTextArea";
import { ConfigurationFormValues } from "../Configuration";

interface AppDescriptionSectionProps {
  register: UseFormRegister<ConfigurationFormValues>;
  errors: FieldErrors<ConfigurationFormValues>;
  isSubmitting: boolean;
  watch: UseFormWatch<ConfigurationFormValues>;
}

export const AppDescriptionSection = (props: AppDescriptionSectionProps) => {
  const { register, errors, isSubmitting, watch } = props;
  return (
    <>
      <h1 className="font-bold">App Description</h1>
      <div className="relative">
        <FieldLabel required className="mb-2 font-rubik">
          Overview
        </FieldLabel>

        <FieldTextArea
          register={register("description_overview")}
          value={watch("description_overview")}
          maxChar={1500}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
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
          register={register("description_how_it_works")}
          value={watch("description_how_it_works")}
          maxChar={1500}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
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
          register={register("description_connect")}
          value={watch("description_connect")}
          maxChar={1500}
          className="w-full font-rubik disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {errors.description_connect?.message && (
          <span className="absolute -bottom-6 left-0 flex items-center text-12 text-danger">
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
          value={watch("world_app_description")}
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
    </>
  );
};
