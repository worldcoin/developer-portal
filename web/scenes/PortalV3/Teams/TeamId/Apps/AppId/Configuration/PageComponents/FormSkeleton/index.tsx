import { SkeletonForm } from "@/components/Skeletons";

export const FormSkeleton = ({ count }: { count: number }) => (
  <SkeletonForm count={count} className="max-w-[580px]" fieldHeight={50} />
);
