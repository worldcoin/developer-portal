import { CSSProperties, ReactNode } from "react";

export const Heading = (props: {
  component: "h1" | "h2" | "h3" | "h4" | "h5";
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const { component: Component, style, children, ...restProps } = props;
  return (
    <Component
      {...restProps}
      style={{ fontFamily: "Sora, sans-serif", ...style }}
    >
      {children}
    </Component>
  );
};
