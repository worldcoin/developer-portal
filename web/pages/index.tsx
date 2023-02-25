import { apps } from "common/Layout/temp-data";
import { urls } from "urls";

const page = () => null;
export default page;

export async function getServerSideProps() {
  return {
    redirect: {
      destination: urls.app(apps[0].id),
      permanent: false,
    },
  };
}
