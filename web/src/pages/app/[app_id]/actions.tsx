import { Actions } from "@/scenes/actions";
import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
export default Actions;

export const getServerSideProps: GetServerSideProps = requireAuthentication();
