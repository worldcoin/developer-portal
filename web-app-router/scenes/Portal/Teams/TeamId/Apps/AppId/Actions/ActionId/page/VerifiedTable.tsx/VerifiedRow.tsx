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
      className="flex flex-row items-center gap-x-4 px-2 group py-3"
    >
      {/* // TODO: Images for each human? */}
      <div className="Capitalize rounded-full flex items-center justify-center h-10 w-10 bg-blue-100 text-blue-500 text-base font-[500]">
        0x
      </div>
      <div className="text-grey-900 text-sm">{`${nullifier.nullifier_hash.slice(0, 10)}...${nullifier.nullifier_hash.slice(-8)}`}</div>
    </div>,
    <div key={`nullifier_${key}_2`} className="text-grey-500 w-12 text-sm ">
      {nullifier.uses}
    </div>,
    <div key={`nullifier_${key}_3`} className="text-sm text-grey-500">
      {timeAgo}
    </div>,
  ];
};
