"use client";
import { atom, useSetAtom } from "jotai";
import { Fragment, ReactNode } from "react";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";

type Images = {
  logo_img_url?: string;
  showcase_image_urls?: string[] | null;
  meta_tag_image_url?: string;
  content_card_image_url?: string;
};

export const viewModeAtom = atom<"unverified" | "verified">("unverified");
export const showReviewStatusAtom = atom<boolean>(true);

export const unverifiedImageAtom = atom<Images>({
  logo_img_url: "loading",
  showcase_image_urls: null,
  meta_tag_image_url: "",
  content_card_image_url: "",
});

export const verifiedImagesAtom = atom<Images>({
  logo_img_url: "",
  showcase_image_urls: null,
  meta_tag_image_url: "",
  content_card_image_url: "",
});

export const ImagesProvider = (props: {
  children: ReactNode;
  appId?: string;
  teamId?: string;
  locale?: string;
}) => {
  const { appId, teamId, locale } = props;
  const setUnverifiedImages = useSetAtom(unverifiedImageAtom);

  const {} = useFetchImagesQuery({
    variables: {
      id: appId ?? "",
      team_id: teamId ?? "",
      locale: locale,
    },

    onCompleted: (data) => {
      setUnverifiedImages({
        logo_img_url: data?.unverified_images?.logo_img_url ?? "",
        showcase_image_urls: data?.unverified_images?.showcase_img_urls,
        meta_tag_image_url: data?.unverified_images?.meta_tag_image_url ?? "",
        content_card_image_url:
          data?.unverified_images?.content_card_image_url ?? "",
      });
    },
  });

  return <Fragment>{props.children}</Fragment>;
};
