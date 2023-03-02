import { Selector } from "./Selector";
import { memo, useMemo, useState } from "react";
import { Icon, IconType } from "src/common/Icon";
import dayjs from "dayjs";
import cn from "classnames";
import { stats as tempStats } from "src/common/Layout/temp-data";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatCard = memo(function StatCard(props: {
  title: string;
  value: string;
  icon: IconType;
  className?: string;
}) {
  return (
    <div className="bg-f3f4f5 rounded-2xl grid grid-cols-auto/1fr justify-items-start items-center gap-x-8 p-8 min-w-[240px]">
      <Icon name={props.icon} className="w-6 h-6 text-primary" />

      <div className="grid gap-y-0.5">
        <span className="text-14 font-medium">{props.value}</span>
        <span>{props.title}</span>
      </div>
    </div>
  );
});

const LegendElement = memo(function LegendElement(props: {
  name: string;
  variant: "primary" | "secondary";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-auto/1fr gap-x-2 items-center",
        props.className
      )}
    >
      <div
        className={cn("w-1.5 h-1.5 rounded-full", {
          "bg-primary": props.variant === "primary",
          "bg-neutral-secondary": props.variant === "secondary",
        })}
      />
      <span
        className={cn("text-12", {
          "text-primary": props.variant === "primary",
          "text-neutral-secondary": props.variant === "secondary",
        })}
      >
        {props.name}
      </span>
    </div>
  );
});

const timespans = [
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
];

export const Stats = memo(function Stats() {
  const stats = tempStats["app_staging_58fcda7a3ec5dc181f91b46e1954a8fc"];
  const [timespan, setTimespan] = useState(timespans[0]);
  const cumulative = true;

  const labelDateFormat = useMemo(() => {
    switch (timespan.value) {
      case "month":
        return "MMM";
      case "week":
        return "D MMM";
      case "day":
        return "D MMM";
    }
  }, [timespan]);

  const data = useMemo(() => {
    if (!stats) {
      return { labels: [] as Array<string>, datasets: [] };
    }

    // FIXME: Move the reducing and the `cumulative` state to Kea
    return stats.reduce(
      (
        accumulator: {
          labels: Array<string>;
          datasets: {
            data: Array<number>;
            pointRadius: Array<number>;
            borderColor: string;
            pointBackgroundColor: string;
          }[];
        },
        currentValue,
        index
      ) => {
        accumulator.labels.push(
          dayjs(currentValue.date).format(labelDateFormat).toString()
        );
        accumulator.datasets[0].data.push(
          !cumulative
            ? currentValue.verifications.total
            : currentValue.verifications.total_cumulative
        );
        accumulator.datasets[1]?.data.push(
          !cumulative
            ? currentValue.unique_users.total
            : currentValue.unique_users.total_cumulative
        );

        if (index === 0 || index === stats.length - 1) {
          accumulator.datasets[0].pointRadius.push(3);
          accumulator.datasets[1].pointRadius.push(3);
        } else {
          accumulator.datasets[0].pointRadius.push(0);
          accumulator.datasets[1].pointRadius.push(1);
        }

        return accumulator;
      },
      {
        labels: [],
        datasets: [
          {
            data: [],
            pointRadius: [],
            borderColor: "#4940e0",
            pointBackgroundColor: "#4940e0",
          },
          {
            data: [],
            pointRadius: [],
            borderColor: "#D6D9DD",
            pointBackgroundColor: "#D6D9DD",
          },
        ],
      }
    );
  }, [stats, labelDateFormat, cumulative]);

  return (
    <section className="grid gap-y-8">
      <h2 className="font-sora text-20 font-semibold">Stats</h2>

      <div>
        <Selector
          selected={timespan}
          options={timespans}
          setOption={setTimespan}
        />

        <div className="grid grid-cols-1fr/auto gap-x-16 mt-4">
          <div>
            <div className="border-y border-f3f4f5">
              <Line
                className="w-full"
                options={{
                  responsive: true,

                  interaction: {
                    intersect: false,
                    mode: "index",
                  },

                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: "#ffffff",
                      bodyColor: "#858494",
                      callbacks: { title: () => "" },
                      displayColors: false,
                    },
                  },

                  aspectRatio: 772 / 205,

                  datasets: {
                    line: {
                      borderColor: "#4940e0",
                    },
                  },

                  scales: {
                    x: {
                      display: false,
                    },

                    y: {
                      display: false,
                    },
                  },
                }}
                data={{
                  labels: data.labels,
                  datasets: data.datasets,
                }}
              />
            </div>
            <div className="flex justify-between text-12 text-657080 mt-3">
              <span>
                {dayjs(stats?.[0].date).format("MMM. DD, YYYY").toString()}
              </span>
              <span>Now</span>
            </div>
          </div>

          <div className="grid gap-y-2 content-center">
            <StatCard title="Verifications" value="1,234" icon="chart" />

            <StatCard
              title="Unique users"
              value="1,234"
              icon="world-id-sign-in"
            />
          </div>
        </div>

        <div className="grid grid-flow-col gap-x-6 justify-start mt-[14px] items-center">
          <LegendElement name="Unique users" variant="primary" />
          <LegendElement name="Verifications" variant="secondary" />
        </div>
      </div>
    </section>
  );
});
