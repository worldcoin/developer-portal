// TEMPORARY probe route for verifying BasePixelStrip in isolation. Delete me.
import { BasePixelStrip } from "@/scenes/Onboarding/Home/components/BasePixelStrip";

export default function PixelProbePage() {
  return (
    <main className="relative h-screen w-screen">
      <BasePixelStrip />
    </main>
  );
}
