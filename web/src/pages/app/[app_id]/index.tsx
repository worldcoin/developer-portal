import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
import { App } from "src/scenes/app";
import { withUserId } from "@/hocs/withUserId";

export default withUserId(App);

export const getServerSideProps: GetServerSideProps = requireAuthentication();
