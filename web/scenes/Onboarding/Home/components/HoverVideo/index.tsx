"use client";

import { useRef } from "react";

type HoverVideoProps = {
  className?: string;
  poster?: string;
  src: string;
};

// Muted, looping video that plays while the pointer is over it and resets on
// leave. Pass `poster` to set a static thumbnail. Used for the product cards in
// the login/landing showcase. The video fills the whole card, so the card's
// label must be `pointer-events-none` for the hover region to cover the frame.
export const HoverVideo = ({ className, poster, src }: HoverVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const play = () => {
    // play() returns a promise that rejects if interrupted; ignore it.
    void videoRef.current?.play().catch(() => {});
  };

  const reset = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.pause();

    if (poster) {
      // A paused <video> keeps showing its current frame, not the poster.
      // Reloading restores the poster image as the resting thumbnail.
      video.load();
    } else {
      video.currentTime = 0;
    }
  };

  return (
    <video
      aria-hidden="true"
      className={className}
      loop
      muted
      onMouseEnter={play}
      onMouseLeave={reset}
      playsInline
      poster={poster}
      preload="metadata"
      ref={videoRef}
      src={src}
    />
  );
};
