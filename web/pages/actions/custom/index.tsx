import { GetServerSideProps } from "next";
import { Actions } from "scenes/actions/actions";
import { fetchActions } from "stores/action-store";
export default Actions;

export const getServerSideProps: GetServerSideProps = async () => {
  await fetchActions();

  return {
    props: {},
  };
};
