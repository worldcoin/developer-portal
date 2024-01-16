import React, { useState, ChangeEvent } from "react";

type ImageUploadComponentProps = {
  onFileSelect: (file: File) => void;
};

const ImageUploadComponent: React.FC<ImageUploadComponentProps> = ({
  onFileSelect,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    // Handle file selection
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.type === "image/png") {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert("Please select a PNG image.");
    }
  };

  return (
    <div>
      <input type="file" accept=".png" onChange={handleFileInput} />
      {selectedFile && <p>File selected: {selectedFile.name}</p>}
    </div>
  );
};

export default ImageUploadComponent;
