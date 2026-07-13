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

// Configuration and its separated Danger zone route share image/view state.
// The flex wrapper keeps each page's `order-*` sections ordered consistently.
export const AppProfileLayout = (props: AppProfileLayout) => {
  const params = props.params;

  return (
    <div className="flex flex-col items-start">
      <ImagesProvider teamId={params?.teamId} appId={params?.appId}>
        {props.children}
      </ImagesProvider>
    </div>
  );
};
