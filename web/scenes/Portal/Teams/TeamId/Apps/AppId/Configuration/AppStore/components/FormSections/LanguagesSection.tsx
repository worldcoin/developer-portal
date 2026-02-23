import { SelectMultiple } from "@/components/SelectMultiple";
import { formLanguagesList, languageMap } from "@/lib/languages";
import { useState } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps } from "../../types/AppStoreFormTypes";
import { ClearConfirmationModal } from "../ClearConfirmationModal";
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
  const [showClearModal, setShowClearModal] = useState(false);

  return (
    <FormSection
      title="Supported Languages"
      description="Choose the languages you want to localize your Mini App Store listing in. Users will then see your Mini App in their preferred language, in the App Store. After selecting languages, you'll be required to fill out the additional sections below."
    >
      <Controller
        control={control}
        name="supported_languages"
        render={({ field }) => (
          <>
            <ClearConfirmationModal
              open={showClearModal}
              setOpen={setShowClearModal}
              type="languages"
              onConfirm={() => field.onChange(["en"])}
            />
            <SelectMultiple
              values={field.value}
              items={allPossibleLanguages}
              label=""
              disabled={!isEditable || !isEnoughPermissions}
              errors={errors.supported_languages}
              showSelectedList
              searchPlaceholder="Enter language"
              selectAllLabel="Add all languages"
              canDelete={(item) => item.value !== "en"}
              renderBadgeIcon={(item) => {
                const language =
                  languageMap[item.value as keyof typeof languageMap];
                const countryCode = language?.country_code;
                if (!countryCode) return null;
                return (
                  <img
                    width={20}
                    height={20}
                    className="size-5 shrink-0"
                    src={`${process.env.NEXT_PUBLIC_APP_URL}/icons/flags/${countryCode}.svg`}
                    alt=""
                  />
                );
              }}
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
              clearAll={() => setShowClearModal(true)}
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
          </>
        )}
      />
    </FormSection>
  );
};
