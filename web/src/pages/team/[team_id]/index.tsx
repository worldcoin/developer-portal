import { GetServerSideProps } from "next";
import { Team } from "src/scenes/team/team";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default Team;

export const getServerSideProps: GetServerSideProps = withPageAuthRequired();
