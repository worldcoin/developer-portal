import { Notification } from "@/components/Notification";
import { SelectMultiple } from "@/components/SelectMultiple";
import { formCountriesList } from "@/lib/languages";
import Image from "next/image";
import { useMemo } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../form-schema";
import { FormSectionProps } from "../../types/AppStoreFormTypes";
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

  return (
    <FormSection
      title="Supported Countries *"
      description="List of countries where your app is available."
      className="grid gap-y-5"
    >
      <Notification variant="warning">
        <div className="text-sm">
          <h3 className="font-medium text-yellow-800">
            Gambling in certain countries
          </h3>
          <div className="mt-2 text-yellow-700">
            Please note that Indonesia, Malaysia, Thailand, United States and
            Poland do not allow chance-based/gambling mini apps. Make sure your
            app proposals and updates for these regions comply with local
            regulations.
          </div>
        </div>
      </Notification>
      <Controller
        control={control}
        name="supported_countries"
        render={({ field }) => (
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
            clearAll={() => field.onChange([])}
            showSelectedList
            searchPlaceholder="Start by typing country..."
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
                  if (!field.value) {
                    return field.onChange([]);
                  }

                  field.onChange(
                    field.value.some((v) => v === value)
                      ? field.value.filter((v) => v !== value)
                      : [...field.value, value],
                  );
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
