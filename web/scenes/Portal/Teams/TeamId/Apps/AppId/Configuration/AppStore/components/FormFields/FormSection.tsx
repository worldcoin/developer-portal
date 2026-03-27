import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  isRequiredAsterisk?: boolean;
  titleVariant?: TYPOGRAPHY;
};

export const FormSection = ({
  title,
  description,
  children,
  className = "",
  isRequiredAsterisk = true,
  titleVariant = TYPOGRAPHY.H7,
}: FormSectionProps) => {
  return (
    <div className={`grid gap-y-5 ${className}`}>
      <div className="grid gap-y-3">
        <Typography
          variant={titleVariant}
          className="font-normal text-grey-900"
        >
          {title}
          {isRequiredAsterisk && (
            <span className="text-system-error-500"> *</span>
          )}
        </Typography>
        {description && (
          <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
            {description}
          </Typography>
        )}
      </div>
      {children}
    </div>
  );
};
