import { GetServerSideProps } from "next";
import { Profile } from "src/scenes/profile";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";

export default Profile;

export const getServerSideProps: GetServerSideProps = withPageAuthRequired();
