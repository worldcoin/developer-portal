import { atom } from "jotai";
import { Color } from "@/scenes/common/colors";

// Shared jotai atom for the per-user accent color. It lives in its own module
// (not `scenes/Portal/layout`, which is a Server Component that imports the
// server-only Auth0 client) so client components can import it without pulling
// `@/lib/auth0` into the client bundle.
export const colorAtom = atom<Color | null>(null);
