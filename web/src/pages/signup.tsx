import { deleteCookie, getCookie, getCookies } from "cookies-next";
import { GetServerSideProps } from "next";
import { Signup } from "src/scenes/signup/signup";
import { GetUsers200ResponseOneOfInner, ManagementClient } from "auth0";

export default Signup;

export const getServerSideProps: GetServerSideProps = async (context) => {
  let auth0Cookie = null;

  try {
    auth0Cookie = JSON.parse(getCookie("auth0Id", context) as string).id;
  } catch (error) {
    console.error(error);
  }

  if (!auth0Cookie) {
    return {
      props: {
        hasAuth0User: false,
      },
    };
  }

  let hasAuth0User = false;

  try {
    const managementClient = new ManagementClient({
      domain: process.env.AUTH0_DOMAIN as string,
      clientSecret: process.env.AUTH0_CLIENT_SECRET as string,
      clientId: process.env.AUTH0_CLIENT_ID as string,
    });

    const userFetchResult = await managementClient.users.get({
      id: auth0Cookie as string,
    });

    if (userFetchResult.data) {
      hasAuth0User = true;
    }
  } catch (error) {
    console.error(error);
  }

  deleteCookie("auth0User", context);

  return {
    props: {
      hasAuth0User,
    },
  };
};
