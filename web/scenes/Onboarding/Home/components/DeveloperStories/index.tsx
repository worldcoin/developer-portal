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
    company: "Divine",
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
    className="size-4 translate-x-[1px] fill-[#181818] md:size-6"
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

    // `scrollend` fires precisely when momentum settles, but Safari does not
    // support it — fall back to a debounced `scroll` listener so the active
    // card stays in sync on swipe in every browser.
    let settleTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(settleTimeout);
      settleTimeout = setTimeout(syncActiveIndex, 120);
    };

    track.addEventListener("scrollend", syncActiveIndex);
    track.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(settleTimeout);
      track.removeEventListener("scrollend", syncActiveIndex);
      track.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="flex w-full flex-col gap-10 text-[#181818]">
      <div className="flex items-end justify-between gap-6">
        <div className="flex max-w-[625px] flex-col gap-4">
          <h2 className="text-[clamp(32px,2.8vw,48px)] leading-[1.2] tracking-[-0.02em]">
            Developer Stories
          </h2>

          <p className="text-[18px] leading-[1.4] md:text-[20px]">
            Explore stories on how emerging and established developers are
            building on World with World ID and proof of human infrastructure to
            create more trusted, human-centered applications.
          </p>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <button
            aria-label="Previous stories"
            className="grid h-8 w-[60px] flex-none place-items-center rounded-full bg-[#edece9] transition-colors hover:bg-[#e1dfda] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#edece9]"
            disabled={activeIndex === 0}
            onClick={() => scrollByCard(-1)}
            type="button"
          >
            <ArrowRightIcon className="size-4 rotate-180" />
          </button>

          <button
            aria-label="Next stories"
            className="grid h-8 w-[60px] flex-none place-items-center rounded-full bg-[#edece9] transition-colors hover:bg-[#e1dfda] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#edece9]"
            disabled={activeIndex === STORIES.length - 1}
            onClick={() => scrollByCard(1)}
            type="button"
          >
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      </div>

      <div
        className="flex flex-col gap-8 [-ms-overflow-style:none] [scrollbar-width:none] md:snap-x md:snap-mandatory md:flex-row md:items-start md:gap-6 md:overflow-x-auto md:pb-2 [&::-webkit-scrollbar]:hidden"
        ref={trackRef}
      >
        {STORIES.map((story, index) => (
          <article
            className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black/5 md:aspect-[3/2] md:flex-[0_0_calc(50%-12px)] md:snap-start md:rounded-2xl"
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
                  <div className="size-full bg-black/10" />
                )}

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-black/15"
                />

                {story.youtubeId ? (
                  <button
                    aria-label={`Play ${story.name}'s story`}
                    className="absolute inset-0 z-10 grid place-items-center"
                    onClick={() => setPlaying(index)}
                    type="button"
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 md:size-14">
                      <PlayGlyph />
                    </span>
                  </button>
                ) : null}

                <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex md:bottom-6 md:left-6">
                  <span className="rounded-lg bg-black/55 px-1.5 py-1 text-[12px] leading-[1.4] text-white md:rounded-xl md:px-3.5 md:py-2 md:text-[clamp(14px,1.2vw,20px)]">
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
