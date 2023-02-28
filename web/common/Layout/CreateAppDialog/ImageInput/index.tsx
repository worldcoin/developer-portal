import { ChangeEvent, memo, useCallback, useEffect, useState } from "react";
import { DialogHeaderIcon } from "common/DialogHeaderIcon";
import { Icon } from "common/Icon";
import cn from "classnames";

export interface ImageInputProps {
  className?: string;
}

export const ImageInput = memo(function ImageInput(props: ImageInputProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileUrl, setImageFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile) {
      let active = true;
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setImageFileUrl(reader.result.toString());
          }
        };
        reader.readAsDataURL(imageFile);
      }
      return () => {
        active = false;
      };
    }
  }, [imageFile]);

  const handleImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) {
      return;
    }
    const file = e.target.files[0];
    if (file && file instanceof File) {
      setImageFile(file);
    } else {
      setImageFile(null);
    }
  }, []);

  return (
    <label
      className={cn(
        props.className,
        "flex items-center justify-center w-full h-full cursor-pointer rounded-full",
        "bg-center bg-contain"
      )}
      style={{ backgroundImage: `url(${imageFileUrl})` }}
    >
      {!imageFileUrl && <DialogHeaderIcon icon="apps" />}
      <div className="absolute right-0 bottom-0 flex items-center justify-center w-6 h-6 bg-ffffff rounded-full">
        <Icon name="camera" className="w-4 h-4 text-primary" />
        <input type="file" className="sr-only" onChange={handleImageChange} />
      </div>
    </label>
  );
});
