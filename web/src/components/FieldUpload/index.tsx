import cn from "classnames";
import { memo, useCallback, useState } from "react";
import { useDropzone, Accept, FileError } from "react-dropzone";
import { File } from "./File";
import { text } from "src/components/styles";

interface FieldUploadInterface {
  className?: string;
  accept?: Accept;
  maxFiles?: number;
  disabled?: boolean;
  validator: (file: File) => FileError | FileError[] | null;
}

export const FieldUpload = memo(function FieldInput(
  props: FieldUploadInterface
) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((files: File[]) => {
    setFiles(files);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: props.accept,
    maxFiles: props.maxFiles,
    noClick: true,
    disabled: props.disabled,
    validator: props.validator,
  });

  return (
    <span
      className={cn(
        "grid items-center justify-center py-16 border border-neutral-muted rounded-xl",
        { "border-neutral-dark": isDragActive },
        { "bg-fbfbfb": props.disabled }
      )}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {files.length ? (
        files.map((file, i) => <File key={i} file={file} />)
      ) : (
        <span className={cn(text.caption, "leading-5")}>
          Drop image here or upload
        </span>
      )}
    </span>
  );
});
