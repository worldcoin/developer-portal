import { Actions } from "@/scenes/actions";
import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
import { withUserId } from "@/hocks/withUserId";

export default withUserId(Actions);

export const getServerSideProps: GetServerSideProps = requireAuthentication();
