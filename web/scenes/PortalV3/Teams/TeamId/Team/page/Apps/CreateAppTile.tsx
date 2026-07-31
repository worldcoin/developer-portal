"use client";

export const CreateAppTile = (props: { onClick: () => void }) => (
  <button
    type="button"
    onClick={props.onClick}
    className="flex min-h-[144px] flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-portal-border text-portal-muted transition-colors hover:border-portal-ink hover:text-portal-ink"
    aria-label="Create an app"
  >
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
    <span className="font-world text-13">Create an app</span>
  </button>
);
