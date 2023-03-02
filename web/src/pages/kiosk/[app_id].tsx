import { NextPageContext } from "next";
import { Kiosk } from "src/scenes/kiosk";
export default Kiosk;

export const getServerSideProps = (context: NextPageContext) => {
  return {
    props: { appId: context.query.app_id },
  };
};
