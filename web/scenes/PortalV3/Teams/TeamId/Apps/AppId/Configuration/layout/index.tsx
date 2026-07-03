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

// The Overview / Danger zone sub-tabs were removed in v3: Danger zone now lives
// as a section inside the Configuration (Overview) page. The flex wrapper is
// kept so the page's `order-*` sections keep their ordering.
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
