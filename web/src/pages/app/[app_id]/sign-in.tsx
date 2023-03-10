import { SignIn } from "@/scenes/sign-in-with-world-id";
import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
export default SignIn;

export const getServerSideProps: GetServerSideProps = requireAuthentication();
