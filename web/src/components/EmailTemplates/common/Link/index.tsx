import { MouseEvent } from "react";

export const Link = (
  props: React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
) => {
  return (
    <a
      {...props}
      onMouseEnter={(e) => {
        (e.target as HTMLAnchorElement).style.opacity = ".5";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLAnchorElement).style.opacity = "1";
      }}
      style={{
        transition: "opacity .25s ease-in-out",
        color: "#4940e0",
        ...props.style,
      }}
    >
      {props.children}
    </a>
  );
};
