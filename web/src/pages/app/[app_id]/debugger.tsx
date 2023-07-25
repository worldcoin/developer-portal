import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
import { Debugger } from "src/scenes/debugger";
import { withUserId } from "@/hocks/withUserId";

export default withUserId(Debugger);

export const getServerSideProps: GetServerSideProps = requireAuthentication();
