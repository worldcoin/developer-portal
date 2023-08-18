import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
import { withUserId } from "@/hocs/withUserId";
import { Team } from "src/scenes/team/team";

export default withUserId(Team);

export const getServerSideProps: GetServerSideProps = requireAuthentication();
