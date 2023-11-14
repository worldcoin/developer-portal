import { getSession } from "@auth0/nextjs-auth0";
import { GetServerSideProps } from "next";
import { urls } from "src/lib/urls";

const page = () => null;
export default page;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getSession(req, res);

  if (!session?.user) {
    return {
      redirect: {
        destination: urls.login(),
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: urls.app(),
      permanent: false,
    },
  };
};
