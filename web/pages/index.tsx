import { urls } from "urls";

// FIXME: temporary redirect from / to /actions
const page = () => null;
export default page;

export async function getServerSideProps() {
  return {
    redirect: {
      destination: urls.actions(),
      permanent: false,
    },
  };
}
