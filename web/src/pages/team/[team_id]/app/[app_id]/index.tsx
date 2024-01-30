import { GetServerSideProps } from "next";
import { App } from "src/scenes/app";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default App;

export const getServerSideProps: GetServerSideProps = withPageAuthRequired();
