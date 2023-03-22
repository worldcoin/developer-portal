import { GetServerSidePropsContext } from "next";
import {
  generateLoginNonce,
  generateLoginUrl,
} from "src/backend/login-internal";
import { Invite } from "src/scenes/invite/invite";
export default Invite;

export interface IInvitePageProps {
  loginUrl?: string;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const nonce = await generateLoginNonce();
  const loginUrl = generateLoginUrl(nonce);

  return {
    props: {
      loginUrl: loginUrl,
    } as IInvitePageProps,
  };
}
