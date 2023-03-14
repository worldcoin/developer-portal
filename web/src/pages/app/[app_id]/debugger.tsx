import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
import { Debugger } from "src/scenes/debugger";

export default Debugger;
export const getServerSideProps: GetServerSideProps = requireAuthentication();
