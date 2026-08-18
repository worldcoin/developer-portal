"use client";

import { useState } from "react";

/**
 * Guards against broken app images. A logo URL is truthy whenever the metadata
 * row names a file, even if that object is missing from the bucket — the
 * signed URL then 404s and the `<img>` paints its alt text over the layout.
 * Callers render their empty state when `isBroken`, keyed on the URL so a
 * fresh upload gets another chance.
 */
export const useImageFallback = (url?: string) => {
  const [failedUrl, setFailedUrl] = useState<string>();

  return {
    isBroken: Boolean(url) && failedUrl === url,
    onError: () => setFailedUrl(url),
  };
};
