// Local-only QA route for BasePixelStrip in isolation, without the real
// homepage's auth/env requirements. 404s outside `pnpm dev` so it's never a
// reachable production (or staging) route.
import { BasePixelStrip } from "@/scenes/Onboarding/Home/components/BasePixelStrip";
import { notFound } from "next/navigation";

export default function PixelProbePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="relative h-screen w-screen">
      <BasePixelStrip />
    </main>
  );
}
