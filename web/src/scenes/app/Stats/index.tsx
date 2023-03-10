import { Selector } from "./StatsSelector";
import { memo, useMemo } from "react";
import dayjs from "dayjs";
import cn from "classnames";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

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
import useAppStats from "src/hooks/useAppStats";
import { IAppStatsStore, useAppStatsStore } from "src/stores/appStatsStore";
import { StatCard } from "./StatCard";

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

const getAppStatsStore = (store: IAppStatsStore) => ({
  timeSpans: store.timeSpans,
  currentTimeSpan: store.currentTimeSpan,
  setCurrentTimeSpan: store.setCurrentTimeSpan,
});

export const Stats = memo(function Stats() {
  const { timeSpans, currentTimeSpan, setCurrentTimeSpan } =
    useAppStatsStore(getAppStatsStore);

  const { stats } = useAppStats();

  const totalVerifications = useMemo(
    () =>
      stats ? stats.reduce((res, item) => res + item.verifications, 0) : 0,
    [stats]
  );

  const totalUnique = useMemo(
    () => (stats ? stats.reduce((res, item) => res + item.unique_users, 0) : 0),
    [stats]
  );

  const labelDateFormat = useMemo(() => {
    switch (currentTimeSpan.value) {
      case "month":
        return "MMM";
      case "week":
        return "D MMM";
    }
  }, [currentTimeSpan.value]);

  const data = useMemo(() => {
    if (!stats) {
      return { labels: [] as Array<string>, datasets: [] };
    }

    // TODO: Optimize this with zustand?
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
        accumulator.datasets[0].data.push(currentValue.verifications);
        accumulator.datasets[1]?.data.push(currentValue.unique_users);

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
  }, [stats, labelDateFormat]);

  return (
    <section className="grid gap-y-8">
      <h2 className="font-sora text-20 font-semibold">Stats</h2>

      <div>
        <Selector
          selected={currentTimeSpan}
          options={timeSpans}
          setOption={setCurrentTimeSpan}
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

                  layout: {
                    padding: {
                      top: 56,
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
              <span>{dayjs(stats?.[0]?.date).format("MMM. DD, YYYY")}</span>
              <span>Now</span>
            </div>
          </div>

          <div className="grid gap-y-2 content-center">
            <StatCard
              title="Verifications"
              value={totalVerifications}
              icon="chart"
            />

            <StatCard
              title="Unique users"
              value={totalUnique}
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
