import { GetServerSideProps } from "next";
import { requireAuthentication } from "src/lib/require-authentication";
import { App } from "src/scenes/app";
export default App;

export const getServerSideProps: GetServerSideProps = requireAuthentication();
