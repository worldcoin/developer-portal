"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { useActionQuery } from "../graphql/get-single-action.generated";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import Link from "next/link";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { VerifiedTable } from "./VerifiedTable/VerifiedTable.tsx";

type ActionIdPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};
export const ActionIdPage = ({ params }: ActionIdPageProps) => {
  const actionID = params?.actionId;

  const { data, loading, refetch } = useActionQuery({
    variables: { action_id: actionID ?? "" },
  });
  const action = data?.action[0];
  if (loading || !action) {
    return <div></div>;
  } else {
    return (
      <div className="w-full h-full flex flex-col items-center ">
        <div className="grid gap-y-2 max-w-[1180px] w-full py-10">
          <div>
            <Link href="." className="flex flex-row items-center gap-x-2">
              <CaretIcon className="h-3 w-3 text-grey-400 rotate-90" />
              <p className="text-grey-700 font-[400] text-xs">
                Back to Incognito Actions
              </p>
            </Link>
          </div>
          <div className="w-full flex justify-between items-center">
            <h1 className="text-grey-900 text-2xl font-[550] capitalize">
              {action.name}
            </h1>
            <DecoratedButton
              variant="secondary"
              href="https://docs.worldcoin.org/id/incognito-actions"
              className="text-grey-700 py-3 px-7 "
            >
              <DocsIcon />
              Learn more
            </DecoratedButton>
          </div>
          <hr className="my-5 w-full text-grey-200 border-dashed" />
          <div className="w-full grid-cols-2 grid items-start justify-between gap-x-32">
            <div className="bg-green-50 h-50 w-50">Action Stats: TODO</div>
            <VerifiedTable nullifiers={action.nullifiers} />
          </div>
        </div>
      </div>
    );
  }
};
