import { notFound } from "next/navigation";
import { ThemePreview } from "./preview";

/** Development-only fixture gallery: real components, no user data or writes. */
export default function ThemePreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ThemePreview />;
}
