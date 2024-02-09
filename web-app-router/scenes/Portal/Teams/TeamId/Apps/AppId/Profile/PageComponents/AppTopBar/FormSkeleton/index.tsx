import Skeleton from "react-loading-skeleton";

export const FormSkeleton = (props: { count: number }) => {
  const { count } = props;
  return (
    <div className="grid grid-cols-1fr/auto max-w-[580px]">
      <Skeleton count={count} height={50} className="gap-y-5" />
    </div>
  );
};
