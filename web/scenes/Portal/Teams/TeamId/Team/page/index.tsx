import { TeamProfile } from "../common/TeamProfile";
import { Apps } from "./Apps";
import { Members } from "./Members";

export const TeamIdPage = () => {
  return (
    <div>
      <TeamProfile />

      <div className="grid gap-y-14 py-8">
        <Members />
        <Apps />
      </div>
    </div>
  );
};
