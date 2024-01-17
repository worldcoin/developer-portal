import React, { useCallback, useState } from "react";

import ImageUploadComponent from "./ImageUploadComponent";

export const ImageUpload = () => {
  return (
    <div>
      <ImageUploadComponent imageType="logo_img" width={100} height={100} />
    </div>
  );
};
