import { Toggle } from "@/components/Toggle";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Control, Controller } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps } from "../../types/AppStoreFormTypes";

type HumansOnlySectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
};

export const HumansOnlySection = ({
  control,
  isEditable,
  isEnoughPermissions,
}: HumansOnlySectionProps) => {
  return (
    <Controller
      name="is_for_humans_only"
      control={control}
      disabled={!isEditable || !isEnoughPermissions}
      render={({ field }) => (
        <div className="rounded-[10px] border border-grey-100 px-6 py-4">
          <div className="flex items-center gap-x-4">
            <div className="grid flex-1 gap-y-1">
              <Typography variant={TYPOGRAPHY.S2} className="text-grey-900">
                Verified humans only
              </Typography>
              <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                Only unique human users verified via World ID can use the app.
                This makes your app eligible for a special badge in the Mini App
                Store.
              </Typography>
            </div>
            <Toggle
              checked={field.value ?? false}
              onChange={field.onChange}
              disabled={!isEditable || !isEnoughPermissions}
            />
          </div>
        </div>
      )}
    />
  );
};
