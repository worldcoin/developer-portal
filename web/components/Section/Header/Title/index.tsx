import { ComponentProps } from "react";
import clsx from "clsx";
import { Typography, TYPOGRAPHY } from "@/components/Typography";

type TitleProps = ComponentProps<"div"> & {};

export const Title = (props: TitleProps) => {
  const { className } = props;
  return (
    <Typography
      as="div"
      className={clsx("col-start-1 max-md:mb-5 max-md:mt-8 md:mb-0", className)}
      variant={TYPOGRAPHY.H7}
    >
      {props.children}
    </Typography>
  );
};
