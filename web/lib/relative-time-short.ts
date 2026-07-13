export const relativeTimeShort = (
  input: string | Date,
  now: Date = new Date(),
): string => {
  const then = input instanceof Date ? input : new Date(input);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 10) {
    return "just now";
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return then.toLocaleDateString();
};
