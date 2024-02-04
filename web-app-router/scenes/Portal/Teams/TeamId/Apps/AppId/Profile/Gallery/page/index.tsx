import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AppTopBar } from "../../Components/AppTopBar";
import { ImageDropZone } from "./ImageDropZone";

type AppProfileGalleryProps = {
  params: Record<string, string> | null | undefined;
};
export const AppProfileGalleryPage = ({ params }: AppProfileGalleryProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  return (
    <div className="py-8 gap-y-4 grid pb-14">
      <AppTopBar appId={appId} teamId={teamId} />
      <hr className="my-5 w-full text-grey-200 border-dashed " />
      <div className="grid grid-cols-2">
        <form className="grid gap-y-7">
          <div className="grid gap-y-3">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
              Featured image
            </Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              This image will be used for featuring your app on the homepage of
              Worldcoin’s App Store, or other display areas of Worldcoin
            </Typography>
          </div>
          <ImageDropZone width={1600} height={1200} />
          <div className="grid gap-y-3">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
              Showcase images
            </Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Upload up to 3 images to showcase your application in work. It
              will be displayed at the top of your app’s detail page in the App
              Store
            </Typography>
          </div>
          <ImageDropZone width={1920} height={1080} />
        </form>
      </div>
    </div>
  );
};
