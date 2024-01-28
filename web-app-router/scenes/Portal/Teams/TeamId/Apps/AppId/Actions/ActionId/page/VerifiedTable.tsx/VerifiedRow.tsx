import { formatDistanceToNow } from "date-fns";
import { NullifierItem } from "./VerifiedTable.tsx";

export const VerifiedRow = (props: {
  nullifier: NullifierItem;
  key: number;
}) => {
  const { nullifier, key } = props;
  const timeAgo = formatDistanceToNow(new Date(nullifier.updated_at), {
    addSuffix: true,
  });

  return [
    <div
      key={`nullifier_${key}_1`}
      className="flex flex-row items-center gap-x-4 px-2 group"
    >
      <div className="uppercase rounded-full flex items-center justify-center h-12 w-12 bg-blue-100 text-blue-500 text-base font-[500]"></div>
      <div>{`${nullifier.nullifier_hash.slice(0, 10)}...${nullifier.nullifier_hash.slice(-8)}`}</div>{" "}
    </div>,
    <div key={`nullifier_${key}_2`} className="text-grey-900 w-12">
      {nullifier.uses}
    </div>,
    <div key={`nullifier_${key}_3`} className="">
      {timeAgo}
    </div>,
  ];
};
