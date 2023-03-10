import { Spinner } from "src/components/Spinner";
import { GetServerSideProps, Redirect } from "next";
import { removeCookies } from "cookies-next";

export default function Logout(): JSX.Element {
  return (
    <div className="flex h-screen w-full justify-center items-center">
      <Spinner />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  removeCookies("auth", context);

  return {
    redirect: {
      statusCode: 302,
      destination: "/login",
    } as Redirect,
  };
};
