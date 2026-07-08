import { SelectMultiple } from "@/components/SelectMultiple";
import { formCountriesList } from "@/lib/languages";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps } from "../../types/AppStoreFormTypes";
import { ClearConfirmationModal } from "../ClearConfirmationModal";
import { FormSection } from "../FormFields/FormSection";

type CountriesSectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
};

export const CountriesSection = ({
  control,
  errors,
  isEditable,
  isEnoughPermissions,
}: CountriesSectionProps) => {
  const countries = useMemo(() => formCountriesList(), []);
  const [showClearModal, setShowClearModal] = useState(false);

  return (
    <FormSection
      title="Supported Countries"
      description="List of countries where your app is available. This setting allows you to display your App in the Mini App Store in selected countries only."
    >
      {/* The laws/regulations warning banner moved to the Availability
          accordion header (always visible, even collapsed). */}
      <Controller
        control={control}
        name="supported_countries"
        render={({ field }) => (
          <>
            <ClearConfirmationModal
              open={showClearModal}
              setOpen={setShowClearModal}
              type="countries"
              onConfirm={() => field.onChange([])}
            />
            <SelectMultiple
              values={field.value}
              onRemove={(value) =>
                field.onChange(field.value.filter((v) => v !== value) ?? [])
              }
              items={countries}
              label=""
              disabled={!isEditable || !isEnoughPermissions}
              errors={errors.supported_countries}
              required
              selectAll={() => field.onChange(countries.map((c) => c.value))}
              canClearAll={field.value?.length > 0}
              clearAll={() => setShowClearModal(true)}
              showSelectedList
              searchPlaceholder="Enter country"
              selectAllLabel="Add all countries"
            >
              {(item, index) => (
                <SelectMultiple.Item
                  icon={
                    <Image
                      width={20}
                      height={20}
                      className="size-5"
                      src={`${process.env.NEXT_PUBLIC_APP_URL}/icons/flags/${item.value}.svg`}
                      alt={`${item.value} flag`}
                    />
                  }
                  key={index}
                  item={item}
                  index={index}
                  checked={field.value?.includes(item.value)}
                  onChange={(value) => {
                    field.onChange(
                      (field.value ?? []).some((v) => v === value)
                        ? (field.value ?? []).filter((v) => v !== value)
                        : [...(field.value ?? []), value],
                    );
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
