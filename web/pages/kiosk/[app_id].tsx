import { GetServerSideProps, NextPageContext } from "next";
import { Kiosk } from "scenes/kiosk/kiosk";
export default Kiosk;

export const getServerSideProps = (context: NextPageContext) => {
  return {
    props: { appId: context.query.app_id },
  };
};
