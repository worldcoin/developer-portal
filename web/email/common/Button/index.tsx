export const Button = (
  props: React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
) => {
  return (
    <a
      {...props}
      style={{
        fontFamily: "Sora, sans-serif",
        display: "block",
        textAlign: "center",
        textTransform: "uppercase",
        color: "#ffffff",
        background: "#4940E0",
        boxShadow:
          "0px 10px 20px rgba(83, 67, 212, 0.2), inset 0px -1px 1px rgba(0, 0, 0, 0.3), inset 0px 1px 1px rgba(255, 255, 255, 0.2)",
        borderRadius: 12,
        padding: 17.5,
        ...props.style,
      }}
    >
      {props.children}
    </a>
  );
};
