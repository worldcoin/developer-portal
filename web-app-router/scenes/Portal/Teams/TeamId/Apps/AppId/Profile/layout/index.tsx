import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { SizingWrapper } from "@/components/SizingWrapper";
import { atom } from "jotai";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { checkUserPermissions } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { Auth0SessionUser } from "@/lib/types";

type Images = {
  logo_img_url?: string;
  hero_image_url?: string;
  showcase_image_urls?: string[] | null;
};

type Params = {
  teamId?: string;
  appId?: string;
  actionId?: string;
};

type AppProfileLayout = {
  params: Params;
  children: ReactNode;
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

export const AppProfileLayout = async (props: AppProfileLayout) => {
  const params = props.params;
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  const isEnoughPermissions = checkUserPermissions(user, params.teamId ?? "", [
    Role_Enum.Owner,
  ]);

  return (
    <div>
      <div className="bg-grey-50 border-b border-grey-100">
        <SizingWrapper variant="nav">
          <Tabs className="m-auto font-gta">
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

            {isEnoughPermissions && (
              <Tab
                className="py-4"
                href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/danger`}
                segment={"danger"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
              </Tab>
            )}
          </Tabs>
        </SizingWrapper>
      </div>
      <SizingWrapper>{props.children}</SizingWrapper>
    </div>
  );
};
