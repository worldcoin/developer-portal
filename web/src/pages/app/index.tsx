import { GetServerSidePropsContext } from "next";

export default function App() {
  return null;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  // FIXME: Get default app for user
  return { redirect: { destination: "/app/app_13", permanent: false } };
}
