"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Link from "next/link";

type ErrorPageProps = {
  statusCode: number;
  title: string;
};

export const ErrorPage = ({ statusCode, title }: ErrorPageProps) => {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <Typography variant={TYPOGRAPHY.H2} className="text-grey-900">
            {statusCode}
          </Typography>
          <div className="h-12 w-px bg-grey-200" />
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            {title}
          </Typography>
        </div>
        <Link href="/teams">
          <DecoratedButton type="button" className="rounded-3xl">
            <Typography variant={TYPOGRAPHY.R3}>Return Home</Typography>
          </DecoratedButton>
        </Link>
      </div>
    </div>
  );
};
