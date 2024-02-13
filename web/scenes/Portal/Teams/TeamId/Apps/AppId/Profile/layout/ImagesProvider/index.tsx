"use client";
import { atom, useSetAtom } from "jotai";
import { ReactNode } from "react";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";

type Images = {
  logo_img_url?: string;
  hero_image_url?: string;
  showcase_image_urls?: string[] | null;
};

export const viewModeAtom = atom<"unverified" | "verified">("unverified");
export const showReviewStatusAtom = atom<boolean>(true);

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

export const ImagesProvider = (props: {
  children: ReactNode;
  appId?: string;
  teamId?: string;
}) => {
  const { appId, teamId } = props;
  const setUnverifiedImages = useSetAtom(unverifiedImageAtom);

  const {} = useFetchImagesQuery({
    variables: {
      id: appId ?? "",
    },
    context: { headers: { team_id: teamId } },
    onCompleted: (data) => {
      setUnverifiedImages({
        logo_img_url: data?.unverified_images?.logo_img_url ?? "",
        hero_image_url: data?.unverified_images?.hero_image_url ?? "",
        showcase_image_urls: data?.unverified_images?.showcase_img_urls,
      });
    },
  });

  return <div>{props.children}</div>;
};
