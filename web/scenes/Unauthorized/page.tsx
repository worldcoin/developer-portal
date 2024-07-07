import { Unauthorized } from "@/components/Unauthorized";

export const UnauthorizedPage = (props: {
  searchParams: Record<string, string> | null | undefined;
}) => {
  const { searchParams } = props;
  const message = searchParams?.message;

  return <Unauthorized className="min-h-[100dvh] w-full" message={message} />;
};
