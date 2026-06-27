"use client";

import { useEffect, useState } from "react";

const PHRASES = ["A new standard of Identity", "An anonymous proof-of-human"];

const TYPE_MS = 65;
const DELETE_MS = 35;
const HOLD_FULL_MS = 1800;
const HOLD_EMPTY_MS = 350;
const START_DELAY_MS = 400;

export const TypingHeadline = ({ className }: { className?: string }) => {
  const [text, setText] = useState("");

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = PHRASES[phraseIndex];

      if (!deleting && charIndex < current.length) {
        charIndex += 1;
        setText(current.slice(0, charIndex));
        const done = charIndex === current.length;
        if (done) {
          deleting = true;
        }
        timeout = setTimeout(tick, done ? HOLD_FULL_MS : TYPE_MS);
      } else if (deleting && charIndex > 0) {
        charIndex -= 1;
        setText(current.slice(0, charIndex));
        const done = charIndex === 0;
        if (done) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % PHRASES.length;
        }
        timeout = setTimeout(tick, done ? HOLD_EMPTY_MS : DELETE_MS);
      } else {
        timeout = setTimeout(tick, TYPE_MS);
      }
    };

    timeout = setTimeout(tick, START_DELAY_MS);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <h1 aria-label={PHRASES[0]} className={className}>
      {/* Static title — shown under reduced-motion / no-JS, and read by crawlers */}
      <span aria-hidden="true" className="motion-safe:hidden">
        {PHRASES[0]}
      </span>

      {/* Animated typing — only when motion is allowed */}
      <span aria-hidden="true" className="hidden motion-safe:inline">
        {text}
        <span className="ml-[0.06em] inline-block h-[0.78em] w-[0.07em] animate-pulse bg-current align-baseline" />
      </span>
    </h1>
  );
};
