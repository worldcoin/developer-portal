"use client";
import { SizingWrapper } from "@/components/SizingWrapper";

type PageProps = {
  params: {
    teamId: string;
  };
};

export const EarningsPage = (props: PageProps) => {
  const { params } = props;
  const teamId = params?.teamId;

  return (
    <>
      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        Earnings
      </SizingWrapper>
    </>
  );
};
