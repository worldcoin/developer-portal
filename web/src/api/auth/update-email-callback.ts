import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next";
import { verifyUserJWT } from "src/backend/jwts";
import { urls } from "src/lib/urls";

export const auth0UpdateEmailCallback = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const auth = getCookie("auth", { req, res }) as string;

  try {
    const token = JSON.parse(auth).token;
    const isTokenValid = await verifyUserJWT(token);

    if (!isTokenValid) {
      throw new Error("Invalid token");
    }
  } catch (error) {
    console.error("Auth0 callback error:", error);
    res.redirect(urls.logout({ error: true }));
  }

  res.redirect(307, urls.app());
};
