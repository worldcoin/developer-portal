"use client";

import { useEffect, useState } from "react";

export const ReviewerDateTime = ({
  className,
  value,
}: {
  className?: string;
  value: string;
}) => {
  const [label, setLabel] = useState(value);

  useEffect(() => {
    const parsed = new Date(value);
    setLabel(Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString());
  }, [value]);

  return (
    <time className={className} dateTime={value}>
      {label}
    </time>
  );
};

export const useReviewerNow = (intervalMs = 30_000) => {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
};

export const ReviewerSubmissionAge = ({ value }: { value: string }) => {
  const now = useReviewerNow();
  if (now === null) return <>—</>;

  const elapsed = now - Date.parse(value);
  if (!Number.isFinite(elapsed) || elapsed < 0) return <>Unknown</>;

  const hours = Math.floor(elapsed / (60 * 60 * 1000));
  return (
    <>
      {hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d ${hours % 24}h`}
    </>
  );
};
