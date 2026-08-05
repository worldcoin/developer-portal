"use client";

import dynamic from "next/dynamic";

// BasePixelStrip pulls in ~45KB gzipped (CELLS + the 553-app icon manifest)
// that's pure decoration - it doesn't affect layout, SEO, or anything above
// the fold structurally. Without code-splitting it here, webpack was folding
// it into a chunk shared across unrelated routes (login, admin, join, ...),
// so pages that never render it still paid for it. `next/dynamic` with
// `ssr: false` needs a client-component call site (Next disallows `ssr:
// false` from Server Components), hence this tiny wrapper - the page that
// renders it (scenes/Onboarding/Home/page) stays a Server Component.
export const LazyBasePixelStrip = dynamic(
  () => import("./index").then((mod) => mod.BasePixelStrip),
  { ssr: false },
);
