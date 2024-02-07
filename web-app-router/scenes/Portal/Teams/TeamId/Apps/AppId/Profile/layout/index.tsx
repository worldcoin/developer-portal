"use client";
import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { useParams } from "next/navigation";
import { SizingWrapper } from "@/components/SizingWrapper";
import { atom } from "jotai";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type Images = {
  logo_img_url?: string;
  hero_image_url?: string;
  showcase_image_urls?: string[] | null;
};

export const viewModeAtom = atom<"unverified" | "verified">("unverified");
export const unverifiedImageAtom = atom<Images>({
  logo_img_url: "",
  hero_image_url: "",
  showcase_image_urls: null,
});
export const verifiedImagesAtom = atom<Images>({
  logo_img_url: "",
  hero_image_url: "",
  showcase_image_urls: null,
});

export const AppProfileLayout = (props: { children: ReactNode }) => {
  const params = useParams<{ teamId: string; appId: string }>();
  return (
    <div>
      <div className="bg-grey-50 border-b border-grey-100">
        <Tabs className="max-w-[1180px] m-auto font-gta">
          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile`}
            segment={null}
          >
            <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
          </Tab>

          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/store-info`}
            segment={"store-info"}
          >
            <Typography variant={TYPOGRAPHY.R4}>Store info</Typography>
          </Tab>

          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/gallery`}
            segment={"gallery"}
          >
            <Typography variant={TYPOGRAPHY.R4}>Gallery</Typography>
          </Tab>

          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/links`}
            segment={"links"}
          >
            <Typography variant={TYPOGRAPHY.R4}>Links</Typography>
          </Tab>

          <Tab
            className="py-4"
            href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/danger`}
            segment={"danger"}
          >
            <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
          </Tab>
        </Tabs>
      </div>
      <SizingWrapper>{props.children}</SizingWrapper>
    </div>
  );
};
