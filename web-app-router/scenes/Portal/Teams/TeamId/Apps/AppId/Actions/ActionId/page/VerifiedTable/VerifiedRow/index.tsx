import { formatDistanceToNow } from "date-fns";
import { NullifierItem } from "../index";

import Image from "next/image";

export const VerifiedRow = (props: {
  nullifier: NullifierItem;
  key: number;
  logo: string;
}) => {
  const { nullifier, key, logo } = props;
  const timeAgo = formatDistanceToNow(new Date(nullifier.updated_at), {
    addSuffix: true,
  });

  return [
    <div
      key={`nullifier_${key}_1`}
      className="flex flex-row items-center gap-x-3 px-2 group py-3"
    >
      {/* // TODO: Images for each human? */}
      <Image src={`/avatars/${logo}`} alt="user" width={40} height={40} />
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
