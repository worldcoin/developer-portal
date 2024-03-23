import { ComponentProps } from "react";
import { Typography, TYPOGRAPHY } from "@/components/Typography";

type TitleProps = ComponentProps<"div"> & {

};

export const Title = (props: TitleProps) => {
  return (
    <Typography as="div" className="col-start-1 max-md:mb-5 max-md:mt-8 md:mb-0" variant={TYPOGRAPHY.H7}>
      {props.children}
    </Typography>
  );
}
