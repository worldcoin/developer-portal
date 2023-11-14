import { GetServerSideProps } from "next";
import { Debugger } from "src/scenes/debugger";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default Debugger;

export const getServerSideProps: GetServerSideProps = withPageAuthRequired();
