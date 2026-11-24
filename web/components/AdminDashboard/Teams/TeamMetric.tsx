type TeamMetricProps = {
  label: string;
  value: string | number;
};

export const TeamMetric = ({ label, value }: TeamMetricProps) => {
  return (
    <div className="min-w-0 rounded-12 bg-grey-50 p-2.5 min-[360px]:p-3">
      <dt
        className="truncate text-12 font-medium tracking-wide text-grey-400 uppercase"
        title={label}
      >
        {label}
      </dt>
      <dd className="mt-1 truncate text-16 font-medium text-grey-900">
        {value}
      </dd>
    </div>
  );
};
