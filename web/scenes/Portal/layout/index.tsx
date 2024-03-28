import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
import { atom } from "jotai";
import { ReactNode } from "react";
import { Color } from "../Profile/types";
import { Header } from "./Header";

export const colorAtom = atom<Color | null>(null);

export const PortalLayout = async (props: { children: ReactNode }) => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const initialColor = calculateColorFromString(
    user?.name ?? user?.email ?? user?.sid,
  );

  return (
    <div className="grid min-h-[100dvh] grid-rows-[auto_1fr]">
      <Header color={initialColor} />
      {props.children}
    </div>
  );
};
