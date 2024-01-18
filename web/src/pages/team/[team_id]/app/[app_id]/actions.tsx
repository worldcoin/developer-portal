import { Actions } from "@/scenes/actions";
import { GetServerSideProps } from "next";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default Actions;

export const getServerSideProps: GetServerSideProps = withPageAuthRequired();
