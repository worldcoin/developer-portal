import { urls } from "urls";

// FIXME: temporary redirect from / to /onboarding
const page = () => null;
export default page;

export async function getServerSideProps() {
  return {
    redirect: {
      destination: urls.apps(),
      permanent: false,
    },
  };
}
