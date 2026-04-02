import { FloatingInput } from "@/components/FloatingInput";
import { FloatingTextArea } from "@/components/FloatingTextArea";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { RemainingCharacters } from "../../../../../PageComponents/RemainingCharacters";
import { AppStoreFormValues } from "../../../../FormSchema/types";

interface LocalisationFieldsProps {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
  selectedIndex: number;
  isEditable: boolean;
  isEnoughPermissions: boolean;
  isMiniApp: boolean;
}

export const LocalisationFields = ({
  control,
  errors,
  selectedIndex,
  isEditable,
  isEnoughPermissions,
  isMiniApp,
}: LocalisationFieldsProps) => {
  const disabled = !isEditable || !isEnoughPermissions;
  const fieldErrors = errors.localisations?.[selectedIndex];

  return (
    <div className="grid gap-y-5">
      {/* name */}
      <Controller
        control={control}
        name={`localisations.${selectedIndex}.name`}
        render={({ field }) => (
          <FloatingInput
            id={`localisation-${selectedIndex}-name`}
            label="App Name"
            value={field.value || ""}
            onChange={field.onChange}
            disabled={disabled}
            errors={fieldErrors?.name}
          />
        )}
      />

      {/* short_name + world_app_description — mini-app only, side by side */}
      {isMiniApp && (
        <div className="grid grid-cols-2 gap-x-5">
          <Controller
            control={control}
            name={`localisations.${selectedIndex}.short_name`}
            render={({ field }) => (
              <FloatingInput
                id={`localisation-${selectedIndex}-short-name`}
                label="Short Name"
                value={field.value || ""}
                onChange={field.onChange}
                disabled={disabled}
                errors={fieldErrors?.short_name}
              />
            )}
          />

          <Controller
            control={control}
            name={`localisations.${selectedIndex}.world_app_description`}
            render={({ field: descField }) => (
              <FloatingInput
                id={`localisation-${selectedIndex}-world-app-description`}
                label="App Tag Line"
                value={descField.value || ""}
                onChange={descField.onChange}
                disabled={disabled}
                errors={fieldErrors?.world_app_description}
              />
            )}
          />
        </div>
      )}

      {/* description_overview */}
      <Controller
        control={control}
        name={`localisations.${selectedIndex}.description_overview`}
        render={({ field: overviewField }) => (
          <FloatingTextArea
            id={`localisation-${selectedIndex}-description-overview`}
            label="Description"
            rows={5}
            maxLength={1500}
            addOnRight={
              overviewField.value ? (
                <RemainingCharacters
                  text={overviewField.value}
                  maxChars={1500}
                />
              ) : undefined
            }
            value={overviewField.value || ""}
            onChange={overviewField.onChange}
            disabled={disabled}
            errors={fieldErrors?.description_overview}
          />
        )}
      />
    </div>
  );
};
