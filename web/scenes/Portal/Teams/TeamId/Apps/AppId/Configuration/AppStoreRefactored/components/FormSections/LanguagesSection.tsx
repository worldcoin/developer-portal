import { SelectMultiple } from "@/components/SelectMultiple";
import { formLanguagesList } from "@/lib/languages";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";

type LanguagesSectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
};

export const LanguagesSection = ({
  control,
  errors,
  isEditable,
  isEnoughPermissions,
}: LanguagesSectionProps) => {
  const allPossibleLanguages = formLanguagesList;

  return (
    <FormSection
      title="Supported Languages"
      description="Select a list of languages your app supports."
      className="grid gap-y-5"
    >
      <Controller
        control={control}
        name="supported_languages"
        render={({ field }) => (
          <SelectMultiple
            values={field.value}
            items={allPossibleLanguages}
            label=""
            disabled={!isEditable || !isEnoughPermissions}
            errors={errors.supported_languages}
            showSelectedList
            searchPlaceholder="Start by typing language..."
            canDelete={(item) => item.value !== "en"}
            onRemove={async (value) => {
              if (value === "en") return;

              const newLanguages =
                field.value?.filter((v) => v !== value) ?? [];
              field.onChange(newLanguages);
            }}
            selectAll={() => {
              const languageValues = allPossibleLanguages.map((c) => c.value);
              field.onChange(languageValues);
            }}
            clearAll={async () => {
              // Keep English language when clearing all
              const newLanguages = ["en"];
              field.onChange(newLanguages);
            }}
            canClearAll={field.value?.length !== 1}
          >
            {(item, index) => (
              <SelectMultiple.Item
                item={item}
                key={index}
                index={index}
                checked={field.value?.includes(item.value)}
                onChange={async (value) => {
                  if (!field.value) {
                    return field.onChange([]);
                  }

                  const isNewLanguage = !field.value.includes(value);
                  const newSupportedLanguages = isNewLanguage
                    ? [...field.value, value]
                    : field.value.filter((v) => v !== value);

                  field.onChange(newSupportedLanguages);
                }}
                disabled={!isEditable || !isEnoughPermissions}
              />
            )}
          </SelectMultiple>
        )}
      />
    </FormSection>
  );
};
