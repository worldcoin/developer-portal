import { GetServerSideProps } from "next";
import { App } from "scenes/app";
export default App;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { app_id } = context.query;
  console.log(app_id);

  return {
    props: { appId: app_id },
  };
};
