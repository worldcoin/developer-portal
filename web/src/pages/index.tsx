import { urls } from "urls";

const page = () => null;
export default page;

export async function getServerSideProps() {
  return {
    redirect: {
      destination: urls.app(),
      permanent: false,
    },
  };
}
