import { ReactNode } from "react";
import { ImagesProvider } from "./ImagesProvider";

type Params = {
  teamId?: string;
  appId?: string;
  actionId?: string;
};

type AppProfileLayout = {
  params: Params;
  children: ReactNode;
};

// The configuration section used to surface an "Overview / Danger zone"
// <SectionSubTabs> bar here. With only two entries it wasn't worth a whole
// bar, so it was replaced by a "Danger zone" button in <AppTopBar>'s action
// row (Owner-gated). This layout now just provides the <ImagesProvider> context
// the configuration and danger pages share.
export const AppProfileLayout = (props: AppProfileLayout) => {
  return (
    <div className="flex flex-col items-start">
      <ImagesProvider teamId={props.params?.teamId} appId={props.params?.appId}>
        {props.children}
      </ImagesProvider>
    </div>
  );
};
