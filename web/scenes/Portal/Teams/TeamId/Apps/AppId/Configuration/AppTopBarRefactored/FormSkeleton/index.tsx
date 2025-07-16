import Skeleton from "react-loading-skeleton";

export const FormSkeleton = (props: { count: number }) => {
  const { count } = props;
  return (
    <div className="grid max-w-[580px] grid-cols-1fr/auto">
      <Skeleton count={count} height={50} className="gap-y-5" />
    </div>
  );
};
