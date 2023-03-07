import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DialogHeaderIcon } from "src/components/DialogHeaderIcon";
import { Icon, IconType } from "src/components/Icon";
import cn from "classnames";

export interface ImageInputProps {
  className?: string;
  icon: IconType;
  imageUrl?: string;
  onImageUrlChange: (imageUrl?: string) => void;
  accept?: string;
  disabled?: boolean;
  imageFile?: File | null;
  setImage?: (props: { file?: File; dataURI?: string }) => void;
}

export const ImageInput = memo(function ImageInput(props: ImageInputProps) {
  const {
    className,
    icon,
    imageUrl,
    onImageUrlChange,
    accept = "image/*",
    disabled,
  } = props;

  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (imageFile) {
      let active = true;
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageUrlChange(reader.result?.toString());
        };
        reader.readAsDataURL(imageFile);
      }
      return () => {
        active = false;
      };
    }
  }, [imageFile, onImageUrlChange]);

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
        className,
        "flex items-center justify-center w-full h-full cursor-pointer rounded-full",
        "bg-center bg-contain"
      )}
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      {!imageUrl && <DialogHeaderIcon icon={icon} />}
      <div className="absolute right-0 bottom-0 flex items-center justify-center w-6 h-6 bg-ffffff rounded-full">
        <Icon name="camera" className="w-4 h-4 text-primary" />
        <input
          type="file"
          className="sr-only"
          onChange={handleImageChange}
          accept={accept}
          disabled={disabled}
        />
      </div>
    </label>
  );
});
