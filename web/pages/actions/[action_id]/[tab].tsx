import { NextPageContext } from "next";
import { Action } from "scenes/action/action";
import { getTabRedirect } from ".";
export default Action;

export function getServerSideProps(ctx: NextPageContext) {
  return getTabRedirect(ctx) || { props: {} };
}
