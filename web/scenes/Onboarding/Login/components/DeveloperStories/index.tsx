"use client";

import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { useEffect, useRef, useState } from "react";

type DeveloperStory = {
  company: string;
  name: string;
  poster: string;
  role: string;
  // YouTube video id; leave empty to show the thumbnail with no play button.
  youtubeId: string;
};

const STORIES: DeveloperStory[] = [
  {
    company: "Credit.cash",
    name: "Diego Estevez",
    poster:
      "https://images.prismic.io/worldcoin-company-website/agb7nKYofJOwHRRv_Frame2147264383-1-.png?auto=format,compress&w=1200",
    role: "Co-Founder",
    youtubeId: "DPiCrh4-5Dc",
  },
  {
    company: "Toktokhan.dev",
    name: "Jangwon Seo",
    poster:
      "https://images.prismic.io/worldcoin-company-website/ag3QGqYofJOwHb_V_aTmV8HNYClf9oBXK_age-verification-privacy-paradox1-1-.png?auto=format,compress&w=1200",
    role: "Founder",
    youtubeId: "KsOXJx_JQ7w",
  },
  {
    company: "tbd.vote",
    name: "Corey Miller",
    poster:
      "https://images.prismic.io/worldcoin-company-website/ag7vZKYofJOwHe23_0dde88b74912f140608b064cc58853a26bbda0cc.jpg?auto=format,compress&w=1200",
    role: "Co-Founder",
    youtubeId: "cnM2VuLlElw",
  },
];

const PlayGlyph = () => (
  <svg
    aria-hidden="true"
    className="size-6 translate-x-[1px] fill-grey-900"
    viewBox="0 0 24 24"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const DeveloperStories = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);

  const scrollToCard = (index: number) => {
    const card = cardRefs.current[index];

    if (!card) {
      return;
    }

    setActiveIndex(index);
    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  const scrollByCard = (direction: 1 | -1) => {
    const nextIndex = Math.min(
      STORIES.length - 1,
      Math.max(0, activeIndex + direction),
    );

    scrollToCard(nextIndex);
  };

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const syncActiveIndex = () => {
      const { left: trackLeft, width: trackWidth } =
        track.getBoundingClientRect();
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      cardRefs.current.forEach((card, index) => {
        if (!card) {
          return;
        }

        const { left: cardLeft, width: cardWidth } =
          card.getBoundingClientRect();
        const distance = Math.abs(
          cardLeft + cardWidth / 2 - (trackLeft + trackWidth / 2),
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    };

    track.addEventListener("scrollend", syncActiveIndex);

    return () => {
      track.removeEventListener("scrollend", syncActiveIndex);
    };
  }, []);

  return (
    <div className="flex w-full flex-col text-white">
      <div className="text-center font-twk text-[32px] font-medium leading-[1.05] tracking-[0] text-white sm:text-[40px] md:text-[56px] lg:text-[64px]">
        Developer stories
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          aria-label="Previous stories"
          className="grid size-12 flex-none place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={activeIndex === 0}
          onClick={() => scrollByCard(-1)}
          type="button"
        >
          <ArrowRightIcon className="size-5 rotate-180" />
        </button>

        <button
          aria-label="Next stories"
          className="grid size-12 flex-none place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={activeIndex === STORIES.length - 1}
          onClick={() => scrollByCard(1)}
          type="button"
        >
          <ArrowRightIcon className="size-5" />
        </button>
      </div>

      <div
        className="mt-3 flex snap-x snap-mandatory items-start gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={trackRef}
      >
        {STORIES.map((story, index) => (
          <article
            className="relative aspect-video w-full min-w-full max-w-full flex-[0_0_100%] snap-start overflow-hidden rounded-[20px] bg-white/5"
            key={story.name}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
          >
            {playing === index && story.youtubeId ? (
              <iframe
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="size-full"
                src={`https://www.youtube.com/embed/${story.youtubeId}?autoplay=1&rel=0`}
                title={`${story.name} — developer story`}
              />
            ) : (
              <>
                {story.poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`${story.name}, ${story.role} at ${story.company}`}
                    className="size-full object-cover"
                    src={story.poster}
                  />
                ) : (
                  <div className="size-full bg-white/10" />
                )}

                {story.youtubeId ? (
                  <button
                    aria-label={`Play ${story.name}'s story`}
                    className="absolute inset-0 z-10 grid place-items-center"
                    onClick={() => setPlaying(index)}
                    type="button"
                  >
                    <span className="grid size-16 place-items-center rounded-full bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-transform hover:scale-105">
                      <PlayGlyph />
                    </span>
                  </button>
                ) : null}

                <div className="pointer-events-none absolute inset-x-4 bottom-4 flex">
                  <span className="rounded-lg bg-black/55 px-3 py-1.5 font-gta text-[15px] leading-none text-white backdrop-blur">
                    {story.name} / {story.role} / {story.company}
                  </span>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
