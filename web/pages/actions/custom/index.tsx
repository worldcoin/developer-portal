import { GetServerSideProps } from "next";
import { Actions } from "scenes/actions/actions";
export default Actions;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
