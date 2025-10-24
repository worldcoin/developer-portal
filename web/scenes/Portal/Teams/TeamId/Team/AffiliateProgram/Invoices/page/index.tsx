"use client";
import { SizingWrapper } from "@/components/SizingWrapper";

type PageProps = {
  params: {
    teamId: string;
  };
};

export const InvoicesPage = (props: PageProps) => {
  const { params } = props;

  return (
    <>
      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        Invoices
      </SizingWrapper>
    </>
  );
};
