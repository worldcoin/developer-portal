"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  ChartDataset,
} from "chart.js";

import { Line } from "react-chartjs-2";
import { useMemo } from "react";

export type ChartProps = {
  data: { y: Array<ChartDataset<"line">>; x: string[] };
  options?: ChartOptions<"line">;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const defaultOptions: ChartOptions<"line"> = {
  responsive: true,

  aspectRatio: 1180 / 350,

  plugins: {
    legend: {
      display: false,
    },

    tooltip: {
      backgroundColor: "#ffffff",
      bodyColor: "#858494",

      callbacks: {
        title: () => "",
        labelColor: (context) => ({
          borderWidth: 0,
          borderRadius: 2,
          borderColor: "transparent",
          backgroundColor: context.dataset.borderColor as string,
        }),
      },

      displayColors: true,
      borderColor: "#EBECEF",
      borderWidth: 1,
    },
  },

  layout: {
    // NOTE: top and right paddings can be only increased
    padding: { left: -24, bottom: -24 },
  },

  scales: {
    x: {
      offset: false,
      display: true,

      border: {
        display: false,
      },

      grid: {
        lineWidth: 0,
      },

      ticks: {
        padding: 24,
        color: "#9BA3AE",
      },
    },

    y: {
      display: true,

      border: {
        display: false,
        dash: [5, 5],
      },

      ticks: {
        padding: 24,
        color: "#9BA3AE",
        font: {
          family: "GT America",
          size: 12,
        },

        maxTicksLimit: 5,
      },
    },
  },
};

export const Chart = (props: ChartProps) => {
  const data: ChartData<"line"> = useMemo(
    () => ({
      labels: props.data.x,
      datasets: props.data.y,
    }),
    [props.data.x, props.data.y]
  );

  const options = useMemo(() => {
    if (!props.options) {
      return defaultOptions;
    }

    return {
      ...defaultOptions,
      ...props.options,
    };
  }, [props.options]);

  return <Line options={options} data={data} />;
};
