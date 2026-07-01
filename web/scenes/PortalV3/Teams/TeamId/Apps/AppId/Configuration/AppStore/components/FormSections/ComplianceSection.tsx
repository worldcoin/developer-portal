import { Toggle } from "@/components/Toggle";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Control, Controller } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps } from "../../types/AppStoreFormTypes";

type ComplianceSectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
};

export const ComplianceSection = ({
  control,
  isEditable,
  isEnoughPermissions,
}: ComplianceSectionProps) => {
  return (
    <Controller
      name="is_android_only"
      control={control}
      disabled={!isEditable || !isEnoughPermissions}
      render={({ field }) => (
        <div className="rounded-[10px] border border-grey-100 px-6 py-4">
          <div className="flex items-center gap-x-4">
            <div className="grid flex-1 gap-y-1">
              <Typography variant={TYPOGRAPHY.S2} className="text-grey-900">
                Compliance
              </Typography>
              <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                Includes functionality that may be considered gambling or the
                purchase of digital in-game items, as defined by Apple.
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
