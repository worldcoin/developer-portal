"use client";

import { useEffect, useState } from "react";

const PHRASE = "A new standard of Identity";

export const TypingHeadline = ({ className }: { className?: string }) => {
  const [text, setText] = useState(PHRASE);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.visibilityState !== "visible"
    ) {
      setText(PHRASE);
      return;
    }

    setText("");

    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setText(PHRASE.slice(0, i));
      if (i >= PHRASE.length) clearInterval(id);
    }, 65);

    return () => clearInterval(id);
  }, []);

  return (
    <h1 className={className}>
      {text}
      {text.length < PHRASE.length && (
        <span className="ml-[0.06em] inline-block h-[0.78em] w-[0.07em] animate-pulse bg-current align-baseline" />
      )}
    </h1>
  );
};
