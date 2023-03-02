import cn from "classnames";
import { memo, ReactNode, useEffect, useState } from "react";

export const File = memo(function File(props: { file: File }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // reads the file with FileReader
  useEffect(() => {
    setPreviewUrl(null);
    let active = true;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (active) {
        setPreviewUrl(reader.result?.toString() ?? null);
      }
    };
    reader.readAsDataURL(props.file);
    return () => {
      active = false;
    };
  }, [props.file]);

  return (
    <span>
      {!previewUrl ? (
        <span>...</span> // @FIXME replace with loader
      ) : (
        <img className="max-w-16 max-h-16" src={previewUrl} />
      )}
    </span>
  );
});
