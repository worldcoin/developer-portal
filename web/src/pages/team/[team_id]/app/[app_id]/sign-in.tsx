import { SignIn } from "@/scenes/sign-in-with-world-id";
import { GetServerSideProps } from "next";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default SignIn;

export const getServerSideProps: GetServerSideProps = withPageAuthRequired();
