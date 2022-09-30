import { NextPageContext } from "next";
import { Action } from "scenes/action/action";
import { urls } from "urls";
export default Action;

const tabs = ["deployment", "display", "stats"];

export const getTabRedirect = (ctx: NextPageContext) => {
  if (
    !ctx.query.tab ||
    !tabs
      .map((i) => i.toLowerCase())
      .includes([ctx.query.tab].flat()[0].toLowerCase())
  ) {
    return {
      redirect: {
        destination: urls.action(ctx.query.action_id as string, tabs[0]),
        permanent: true,
      },
    };
  }

  return null;
};

export function getServerSideProps(ctx: NextPageContext) {
  return getTabRedirect(ctx) || { props: {} };
}
