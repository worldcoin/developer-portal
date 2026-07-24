"use client";

export const CreateActionTile = (props: { onClick?: () => void }) => (
  <button
    type="button"
    onClick={props.onClick}
    disabled={!props.onClick}
    className="flex min-h-[144px] flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-portal-border text-portal-muted transition-colors enabled:hover:border-portal-ink enabled:hover:text-portal-ink"
    aria-label="Create action"
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
    <span className="font-world text-13">Create action</span>
  </button>
);
