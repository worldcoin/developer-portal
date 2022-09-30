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
import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { Selector } from "./Selector";
import { useActions, useValues } from "kea";
import dayjs from "dayjs";
import { actionLogic } from "logics/actionLogic";
import { Checkbox } from "common/components/Checkbox";

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

export function Stats() {
  const { currentAction, statsArgs, currentActionStats } =
    useValues(actionLogic);
  const { setStatsArgs } = useActions(actionLogic);

  const labelDateFormat = useMemo(() => {
    switch (statsArgs.timespan) {
      case "month":
        return "MMM";
      case "week":
        return "D MMM";
      case "day":
        return "D MMM";
    }
  }, [statsArgs.timespan]);

  const [cumulative, setCumulative] = useState(false);

  // FIXME This `data` should be computed in a kea selector
  const data = useMemo(() => {
    if (!currentActionStats) {
      return { labels: [] as Array<string>, datasets: [] };
    }

    // FIXME: Move the reducing and the `cumulative` state to Kea
    return currentActionStats.reduce(
      (
        accumulator: {
          labels: Array<string>;
          datasets: [{ data: Array<number>; pointRadius: Array<number> }];
        },
        currentValue,
        index
      ) => {
        accumulator.labels.push(
          dayjs(currentValue.date).format(labelDateFormat).toString()
        );
        accumulator.datasets[0].data.push(
          !cumulative ? currentValue.total : currentValue.total_cumulative
        );

        if (index === 0 || index === currentActionStats.length - 1) {
          accumulator.datasets[0].pointRadius.push(5);
        } else {
          accumulator.datasets[0].pointRadius.push(0);
        }

        return accumulator;
      },
      {
        labels: [],
        datasets: [{ data: [], pointRadius: [] }],
      }
    );
  }, [labelDateFormat, currentActionStats, cumulative]);

  return (
    <div className="grid col-span-2">
      <p className="font-medium text-20 font-sora">Stats</p>

      <div className="grid grid-flow-col auto-cols-max items-center gap-x-4 justify-self-end">
        <Checkbox
          onChange={(checked) => setCumulative(checked)}
          label="Cumulative"
          checked={cumulative}
        />

        <Selector
          value={statsArgs.timespan}
          changeTimespan={(timespan) => setStatsArgs({ timespan }, true)}
          values={{ month: "Monthly", week: "Weekly", day: "Daily" }}
        />
      </div>

      <div className="col-span-2 mt-4">
        <p className="leading-6 text-[24px] font-sora font-medium">
          {currentAction?.nullifiers_aggregate?.aggregate.count.toLocaleString() ??
            "Unknown"}
        </p>

        <span className="leading-[18px] text-14 text-neutral font-sora">
          Unique humans verified
        </span>

        {/* FIXME This feature will be implemented later */}
        {/* <Link
          className={cn(
            "mt-1 grid items-center grid-flow-col auto-cols-max text-primary gap-x-1.5 hover:opacity-70 transition-opacity"
          )}
          href="#"
        >
          Export nullifiers (IDs) <Icon className="w-4 h-4" name="export" />
        </Link> */}

        <div>
          <Line
            className="w-full mt-8"
            options={{
              responsive: true,
              layout: { padding: { left: -10 } },

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

              maintainAspectRatio: true,
              aspectRatio: 600 / 247,

              datasets: {
                line: {
                  borderColor: "#4940e0",

                  backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;

                    if (!chartArea) {
                      return "transparent";
                    }

                    const gradient = ctx.createLinearGradient(
                      0,
                      chartArea.bottom,
                      0,
                      chartArea.top
                    );
                    gradient.addColorStop(0, "transparent");
                    gradient.addColorStop(1, "rgba(73, 64, 224, .1)");

                    return gradient;
                  },

                  fill: true,
                  pointBackgroundColor: "#fcfcfc",
                  pointBorderWidth: 2,
                },
              },

              scales: {
                x: {
                  grid: { display: false, drawBorder: false },

                  ticks: {
                    color: "#858494",
                    font: { size: 11, family: "Rubik" },
                    align: "end",
                  },
                },

                y: {
                  beginAtZero: true,

                  grid: {
                    borderDash: [6, 10],
                    color: "rgba(25, 28, 32, 0.1)",
                    drawBorder: false,
                    drawOnChartArea: true,
                    drawTicks: false,
                  },

                  ticks: {
                    color: "#858494",
                    font: { size: 12, family: "Rubik" },
                    padding: 10,
                  },
                },
              },
            }}
            data={{
              labels: data.labels,
              datasets: data.datasets,
            }}
          />
        </div>
      </div>
    </div>
  );
}
