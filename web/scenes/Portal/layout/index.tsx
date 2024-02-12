import { ReactNode } from "react";
import { Header } from "./Header";
import { atom } from "jotai";
import { getSession } from "@auth0/nextjs-auth0";
import { Auth0SessionUser } from "@/lib/types";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Color } from "../Profile/types";

export const colorAtom = atom<Color | null>(null);

export const PortalLayout = async (props: { children: ReactNode }) => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const initialColor = calculateColorFromString(user?.name ?? user?.email);

  return (
    <div className="min-h-[100dvh] grid grid-rows-auto/1fr">
      <Header color={initialColor} />
      {props.children}
    </div>
  );
};
