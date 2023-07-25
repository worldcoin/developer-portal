import { SignIn } from "@/scenes/sign-in-with-world-id";
import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
import { withUserId } from "@/hocs/withUserId";

export default withUserId(SignIn);

export const getServerSideProps: GetServerSideProps = requireAuthentication();
