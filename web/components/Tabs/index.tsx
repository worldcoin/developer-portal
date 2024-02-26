"use client";
import {
  HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/Icons/ChevronRightIcon";

export * from "./Tab";

type TabsProps = HTMLAttributes<HTMLDivElement>;

export const Tabs = (props: TabsProps) => {
  const { className, style = {}, ...otherProps } = props;

  const ref = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const node = ref.current;
    const handleScroll = () => {
      const offsetWidth = node.offsetWidth;
      const scrollWidth = node.scrollWidth;
      const scrollLeft = node.scrollLeft;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollWidth - scrollLeft > offsetWidth);
    };
    const observer = new ResizeObserver(() => {
      handleScroll();
    });
    node.addEventListener("scroll", handleScroll, { passive: true });
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", handleScroll);
      observer.unobserve(node);
    };
  }, []);

  const handleScrollToLeft = useCallback(() => {
    if (!ref.current) {
      return;
    }
    ref.current?.scrollTo({
      left: 0,
      behavior: "smooth",
    });
  }, []);

  const handleScrollToRight = useCallback(() => {
    if (!ref.current) {
      return;
    }
    ref.current?.scrollTo({
      left: ref.current.scrollWidth - ref.current.offsetWidth,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="relative -mx-6">
      <div
        ref={ref}
        className={twMerge("flex gap-x-4 overflow-x-scroll px-6", className)}
        style={{
          ...style,
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          scrollPadding: "0 1.5rem",
          whiteSpace: "nowrap",
          overscrollBehaviorX: "none",
        }}
        {...otherProps}
      />

      {canScrollLeft && (
        <div
          className="absolute inset-y-0 left-0 flex w-10 items-center justify-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 70%, rgba(0,0,0,0) 100%)",
          }}
          onClick={handleScrollToLeft}
        >
          <ChevronLeftIcon />
        </div>
      )}

      {canScrollRight && (
        <div
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center"
          style={{
            backgroundImage:
              "linear-gradient(-90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 70%, rgba(0,0,0,0) 100%)",
          }}
          onClick={handleScrollToRight}
        >
          <ChevronRightIcon />
        </div>
      )}
    </div>
  );
};
