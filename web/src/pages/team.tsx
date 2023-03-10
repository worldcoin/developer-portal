import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
import { Team } from "src/scenes/team/team";
export default Team;

export const getServerSideProps: GetServerSideProps = requireAuthentication();
