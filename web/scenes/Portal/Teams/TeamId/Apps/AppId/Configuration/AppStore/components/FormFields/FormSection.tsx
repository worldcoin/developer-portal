import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  isRequiredAsterisk?: boolean;
};

export const FormSection = ({
  title,
  description,
  children,
  className = "",
  isRequiredAsterisk = true,
}: FormSectionProps) => {
  return (
    <div className={`grid gap-y-3 ${className}`}>
      <Typography variant={TYPOGRAPHY.H7} className="text-grey-700">
        {title}
        {isRequiredAsterisk && <span className="text-red-500"> *</span>}
      </Typography>
      {description && (
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          {description}
        </Typography>
      )}
      {children}
    </div>
  );
};
