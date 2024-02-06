import Image from "next/image";

export const ImageDisplay = (props: {
  src: string;
  type: string;
  className?: string;
  width?: number;
  height?: number;
}) => {
  const { src, type, className, width, height } = props;
  if (type === "verified") {
    return <img src={src} alt="verified" className={className} />;
  }
  return (
    <Image
      src={src}
      alt="image"
      className={className}
      width={width}
      height={height}
    />
  );
};
