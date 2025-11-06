import { AffiliateOverviewResponse } from "@/lib/types";

export function getAffiliateOverviewMock(
  period: "day" | "week" | "month" | "year",
): AffiliateOverviewResponse {
  switch (period) {
    case "day":
      return dailyOverviewMock;
    case "week":
      return weeklyOverviewMock;
    case "month":
      return monthlyOverviewMock;
    case "year":
      return yearlyOverviewMock;
    default:
      return weeklyOverviewMock; // fallback to weekly
  }
}

export const weeklyOverviewMock: AffiliateOverviewResponse = {
  result: {
    period: "week",
    verifications: {
      total: 108,
      orb: 65, // 60% of 108
      nfc: 43, // 40% of 108
      periods: [
        {
          start: "2025-10-20T00:00:00Z",
          end: "2025-10-21T00:00:00Z",
          count: 15,
          orb: 9,
          nfc: 6,
        },
        {
          start: "2025-10-21T00:00:00Z",
          end: "2025-10-22T00:00:00Z",
          count: 33, // 15 + 18
          orb: 20, // 9 + 11
          nfc: 13, // 6 + 7
        },
        {
          start: "2025-10-22T00:00:00Z",
          end: "2025-10-23T00:00:00Z",
          count: 45, // 33 + 12
          orb: 27, // 20 + 7
          nfc: 18, // 13 + 5
        },
        {
          start: "2025-10-23T00:00:00Z",
          end: "2025-10-24T00:00:00Z",
          count: 65, // 45 + 20
          orb: 39, // 27 + 12
          nfc: 26, // 18 + 8
        },
        {
          start: "2025-10-24T00:00:00Z",
          end: "2025-10-25T00:00:00Z",
          count: 81, // 65 + 16
          orb: 49, // 39 + 10
          nfc: 32, // 26 + 6
        },
        {
          start: "2025-10-25T00:00:00Z",
          end: "2025-10-26T00:00:00Z",
          count: 95, // 81 + 14
          orb: 57, // 49 + 8
          nfc: 38, // 32 + 6
        },
        {
          start: "2025-10-26T00:00:00Z",
          end: "2025-10-27T00:00:00Z",
          count: 108, // 95 + 13
          orb: 65, // 57 + 8
          nfc: 43, // 38 + 5
        },
      ],
    },
    earnings: {
      total: {
        inWLD: "108000000000000000000", // 108 WLD in wei
        inCurrency: 108,
      },
      totalInCurrency: 108.0,
      totalByType: {
        orb: {
          inWLD: "64800000000000000000", // 60% of 108 WLD
          inCurrency: 64.8,
        },
        nfc: {
          inWLD: "43200000000000000000", // 40% of 108 WLD
          inCurrency: 43.2,
        },
      },
      periods: [
        {
          start: "2025-10-20T00:00:00Z",
          end: "2025-10-21T00:00:00Z",
          amount: {
            inWLD: "15000000000000000000", // 15 WLD
            inCurrency: 15.0,
          },
          amountInCurrency: 15.0,
          amountByType: {
            orb: { inWLD: "9000000000000000000", inCurrency: 9.0 }, // 60% of 15
            nfc: { inWLD: "6000000000000000000", inCurrency: 6.0 }, // 40% of 15
          },
        },
        {
          start: "2025-10-21T00:00:00Z",
          end: "2025-10-22T00:00:00Z",
          amount: {
            inWLD: "33000000000000000000", // 15 + 18 = 33 WLD
            inCurrency: 33.0,
          },
          amountInCurrency: 33.0,
          amountByType: {
            orb: { inWLD: "19800000000000000000", inCurrency: 19.8 }, // 60% of 33
            nfc: { inWLD: "13200000000000000000", inCurrency: 13.2 }, // 40% of 33
          },
        },
        {
          start: "2025-10-22T00:00:00Z",
          end: "2025-10-23T00:00:00Z",
          amount: {
            inWLD: "45000000000000000000", // 33 + 12 = 45 WLD
            inCurrency: 45.0,
          },
          amountInCurrency: 45.0,
          amountByType: {
            orb: { inWLD: "27000000000000000000", inCurrency: 27.0 }, // 60% of 45
            nfc: { inWLD: "18000000000000000000", inCurrency: 18.0 }, // 40% of 45
          },
        },
        {
          start: "2025-10-23T00:00:00Z",
          end: "2025-10-24T00:00:00Z",
          amount: {
            inWLD: "65000000000000000000", // 45 + 20 = 65 WLD
            inCurrency: 65.0,
          },
          amountInCurrency: 65.0,
          amountByType: {
            orb: { inWLD: "39000000000000000000", inCurrency: 39.0 }, // 60% of 65
            nfc: { inWLD: "26000000000000000000", inCurrency: 26.0 }, // 40% of 65
          },
        },
        {
          start: "2025-10-24T00:00:00Z",
          end: "2025-10-25T00:00:00Z",
          amount: {
            inWLD: "81000000000000000000", // 65 + 16 = 81 WLD
            inCurrency: 81.0,
          },
          amountInCurrency: 81.0,
          amountByType: {
            orb: { inWLD: "48600000000000000000", inCurrency: 48.6 }, // 60% of 81
            nfc: { inWLD: "32400000000000000000", inCurrency: 32.4 }, // 40% of 81
          },
        },
        {
          start: "2025-10-25T00:00:00Z",
          end: "2025-10-26T00:00:00Z",
          amount: {
            inWLD: "95000000000000000000", // 81 + 14 = 95 WLD
            inCurrency: 95.0,
          },
          amountInCurrency: 95.0,
          amountByType: {
            orb: { inWLD: "57000000000000000000", inCurrency: 57.0 }, // 60% of 95
            nfc: { inWLD: "38000000000000000000", inCurrency: 38.0 }, // 40% of 95
          },
        },
        {
          start: "2025-10-26T00:00:00Z",
          end: "2025-10-27T00:00:00Z",
          amount: {
            inWLD: "108000000000000000000", // 95 + 13 = 108 WLD
            inCurrency: 108.0,
          },
          amountInCurrency: 108.0,
          amountByType: {
            orb: { inWLD: "64800000000000000000", inCurrency: 64.8 }, // 60% of 108
            nfc: { inWLD: "43200000000000000000", inCurrency: 43.2 }, // 40% of 108
          },
        },
      ],
    },
  },
};

export const dailyOverviewMock: AffiliateOverviewResponse = {
  result: {
    period: "day",
    verifications: {
      total: 12,
      orb: 7, // 60% of 12
      nfc: 5, // 40% of 12
      periods: [
        {
          start: "2025-10-20T00:00:00Z",
          end: "2025-10-20T01:00:00Z",
          count: 1,
          orb: 1,
          nfc: 0,
        },
        {
          start: "2025-10-20T01:00:00Z",
          end: "2025-10-20T02:00:00Z",
          count: 2,
          orb: 1,
          nfc: 1,
        },
        {
          start: "2025-10-20T02:00:00Z",
          end: "2025-10-20T03:00:00Z",
          count: 3,
          orb: 2,
          nfc: 1,
        },
        {
          start: "2025-10-20T03:00:00Z",
          end: "2025-10-20T04:00:00Z",
          count: 4,
          orb: 2,
          nfc: 2,
        },
        {
          start: "2025-10-20T04:00:00Z",
          end: "2025-10-20T05:00:00Z",
          count: 5,
          orb: 3,
          nfc: 2,
        },
        {
          start: "2025-10-20T05:00:00Z",
          end: "2025-10-20T06:00:00Z",
          count: 6,
          orb: 4,
          nfc: 2,
        },
        {
          start: "2025-10-20T06:00:00Z",
          end: "2025-10-20T07:00:00Z",
          count: 7,
          orb: 4,
          nfc: 3,
        },
        {
          start: "2025-10-20T07:00:00Z",
          end: "2025-10-20T08:00:00Z",
          count: 8,
          orb: 5,
          nfc: 3,
        },
        {
          start: "2025-10-20T08:00:00Z",
          end: "2025-10-20T09:00:00Z",
          count: 9,
          orb: 5,
          nfc: 4,
        },
        {
          start: "2025-10-20T09:00:00Z",
          end: "2025-10-20T10:00:00Z",
          count: 10,
          orb: 6,
          nfc: 4,
        },
        {
          start: "2025-10-20T10:00:00Z",
          end: "2025-10-20T11:00:00Z",
          count: 11,
          orb: 7,
          nfc: 4,
        },
        {
          start: "2025-10-20T11:00:00Z",
          end: "2025-10-20T12:00:00Z",
          count: 12,
          orb: 7,
          nfc: 5,
        },
      ],
    },
    earnings: {
      total: {
        inWLD: "12000000000000000000",
        inCurrency: 18,
      },
      totalInCurrency: 12.0,
      totalByType: {
        orb: {
          inWLD: "7200000000000000000", // 60% of 12 WLD
          inCurrency: 7.2,
        },
        nfc: {
          inWLD: "4800000000000000000", // 40% of 12 WLD
          inCurrency: 4.8,
        },
      },
      periods: [
        {
          start: "2025-10-20T00:00:00Z",
          end: "2025-10-20T01:00:00Z",
          amount: {
            inWLD: "1000000000000000000", // 1 WLD
            inCurrency: 1.0,
          },
          amountInCurrency: 1.0,
          amountByType: {
            orb: { inWLD: "1000000000000000000", inCurrency: 1.0 },
            nfc: { inWLD: "0", inCurrency: 0.0 },
          },
        },
        {
          start: "2025-10-20T01:00:00Z",
          end: "2025-10-20T02:00:00Z",
          amount: {
            inWLD: "2000000000000000000", // 2 WLD
            inCurrency: 2.0,
          },
          amountInCurrency: 2.0,
          amountByType: {
            orb: { inWLD: "1000000000000000000", inCurrency: 1.0 },
            nfc: { inWLD: "1000000000000000000", inCurrency: 1.0 },
          },
        },
        {
          start: "2025-10-20T02:00:00Z",
          end: "2025-10-20T03:00:00Z",
          amount: {
            inWLD: "3000000000000000000", // 3 WLD
            inCurrency: 3.0,
          },
          amountInCurrency: 3.0,
          amountByType: {
            orb: { inWLD: "2000000000000000000", inCurrency: 2.0 },
            nfc: { inWLD: "1000000000000000000", inCurrency: 1.0 },
          },
        },
        {
          start: "2025-10-20T03:00:00Z",
          end: "2025-10-20T04:00:00Z",
          amount: {
            inWLD: "4000000000000000000", // 4 WLD
            inCurrency: 4.0,
          },
          amountInCurrency: 4.0,
          amountByType: {
            orb: { inWLD: "2000000000000000000", inCurrency: 2.0 },
            nfc: { inWLD: "2000000000000000000", inCurrency: 2.0 },
          },
        },
        {
          start: "2025-10-20T04:00:00Z",
          end: "2025-10-20T05:00:00Z",
          amount: {
            inWLD: "5000000000000000000", // 5 WLD
            inCurrency: 5.0,
          },
          amountInCurrency: 5.0,
          amountByType: {
            orb: { inWLD: "3000000000000000000", inCurrency: 3.0 },
            nfc: { inWLD: "2000000000000000000", inCurrency: 2.0 },
          },
        },
        {
          start: "2025-10-20T05:00:00Z",
          end: "2025-10-20T06:00:00Z",
          amount: {
            inWLD: "6000000000000000000", // 6 WLD
            inCurrency: 6.0,
          },
          amountInCurrency: 6.0,
          amountByType: {
            orb: { inWLD: "4000000000000000000", inCurrency: 4.0 },
            nfc: { inWLD: "2000000000000000000", inCurrency: 2.0 },
          },
        },
        {
          start: "2025-10-20T06:00:00Z",
          end: "2025-10-20T07:00:00Z",
          amount: {
            inWLD: "7000000000000000000", // 7 WLD
            inCurrency: 7.0,
          },
          amountInCurrency: 7.0,
          amountByType: {
            orb: { inWLD: "4000000000000000000", inCurrency: 4.0 },
            nfc: { inWLD: "3000000000000000000", inCurrency: 3.0 },
          },
        },
        {
          start: "2025-10-20T07:00:00Z",
          end: "2025-10-20T08:00:00Z",
          amount: {
            inWLD: "8000000000000000000", // 8 WLD
            inCurrency: 8.0,
          },
          amountInCurrency: 8.0,
          amountByType: {
            orb: { inWLD: "5000000000000000000", inCurrency: 5.0 },
            nfc: { inWLD: "3000000000000000000", inCurrency: 3.0 },
          },
        },
        {
          start: "2025-10-20T08:00:00Z",
          end: "2025-10-20T09:00:00Z",
          amount: {
            inWLD: "9000000000000000000", // 9 WLD
            inCurrency: 9.0,
          },
          amountInCurrency: 9.0,
          amountByType: {
            orb: { inWLD: "5000000000000000000", inCurrency: 5.0 },
            nfc: { inWLD: "4000000000000000000", inCurrency: 4.0 },
          },
        },
        {
          start: "2025-10-20T09:00:00Z",
          end: "2025-10-20T10:00:00Z",
          amount: {
            inWLD: "10000000000000000000", // 10 WLD
            inCurrency: 10.0,
          },
          amountInCurrency: 10.0,
          amountByType: {
            orb: { inWLD: "6000000000000000000", inCurrency: 6.0 },
            nfc: { inWLD: "4000000000000000000", inCurrency: 4.0 },
          },
        },
        {
          start: "2025-10-20T10:00:00Z",
          end: "2025-10-20T11:00:00Z",
          amount: {
            inWLD: "11000000000000000000", // 11 WLD
            inCurrency: 11.0,
          },
          amountInCurrency: 11.0,
          amountByType: {
            orb: { inWLD: "7000000000000000000", inCurrency: 7.0 },
            nfc: { inWLD: "4000000000000000000", inCurrency: 4.0 },
          },
        },
        {
          start: "2025-10-20T11:00:00Z",
          end: "2025-10-20T12:00:00Z",
          amount: {
            inWLD: "12000000000000000000", // 12 WLD
            inCurrency: 12.0,
          },
          amountInCurrency: 12.0,
          amountByType: {
            orb: { inWLD: "7200000000000000000", inCurrency: 7.2 },
            nfc: { inWLD: "4800000000000000000", inCurrency: 4.8 },
          },
        },
      ],
    },
  },
};

export const monthlyOverviewMock: AffiliateOverviewResponse = {
  result: {
    period: "month",
    verifications: {
      total: 528,
      orb: 317, // 60% of 528
      nfc: 211, // 40% of 528
      periods: [
        {
          start: "2025-10-01T00:00:00Z",
          end: "2025-10-02T00:00:00Z",
          count: 22,
          orb: 13,
          nfc: 9,
        },
        {
          start: "2025-10-02T00:00:00Z",
          end: "2025-10-03T00:00:00Z",
          count: 45,
          orb: 27,
          nfc: 18,
        },
        {
          start: "2025-10-03T00:00:00Z",
          end: "2025-10-04T00:00:00Z",
          count: 67,
          orb: 40,
          nfc: 27,
        },
        {
          start: "2025-10-04T00:00:00Z",
          end: "2025-10-05T00:00:00Z",
          count: 89,
          orb: 53,
          nfc: 36,
        },
        {
          start: "2025-10-05T00:00:00Z",
          end: "2025-10-06T00:00:00Z",
          count: 112,
          orb: 67,
          nfc: 45,
        },
        {
          start: "2025-10-06T00:00:00Z",
          end: "2025-10-07T00:00:00Z",
          count: 134,
          orb: 80,
          nfc: 54,
        },
        {
          start: "2025-10-07T00:00:00Z",
          end: "2025-10-08T00:00:00Z",
          count: 156,
          orb: 94,
          nfc: 62,
        },
        {
          start: "2025-10-08T00:00:00Z",
          end: "2025-10-09T00:00:00Z",
          count: 178,
          orb: 107,
          nfc: 71,
        },
        {
          start: "2025-10-09T00:00:00Z",
          end: "2025-10-10T00:00:00Z",
          count: 201,
          orb: 121,
          nfc: 80,
        },
        {
          start: "2025-10-10T00:00:00Z",
          end: "2025-10-11T00:00:00Z",
          count: 223,
          orb: 134,
          nfc: 89,
        },
        {
          start: "2025-10-11T00:00:00Z",
          end: "2025-10-12T00:00:00Z",
          count: 245,
          orb: 147,
          nfc: 98,
        },
        {
          start: "2025-10-12T00:00:00Z",
          end: "2025-10-13T00:00:00Z",
          count: 267,
          orb: 160,
          nfc: 107,
        },
        {
          start: "2025-10-13T00:00:00Z",
          end: "2025-10-14T00:00:00Z",
          count: 290,
          orb: 174,
          nfc: 116,
        },
        {
          start: "2025-10-14T00:00:00Z",
          end: "2025-10-15T00:00:00Z",
          count: 312,
          orb: 187,
          nfc: 125,
        },
        {
          start: "2025-10-15T00:00:00Z",
          end: "2025-10-16T00:00:00Z",
          count: 334,
          orb: 200,
          nfc: 134,
        },
        {
          start: "2025-10-16T00:00:00Z",
          end: "2025-10-17T00:00:00Z",
          count: 356,
          orb: 214,
          nfc: 142,
        },
        {
          start: "2025-10-17T00:00:00Z",
          end: "2025-10-18T00:00:00Z",
          count: 378,
          orb: 227,
          nfc: 151,
        },
        {
          start: "2025-10-18T00:00:00Z",
          end: "2025-10-19T00:00:00Z",
          count: 401,
          orb: 241,
          nfc: 160,
        },
        {
          start: "2025-10-19T00:00:00Z",
          end: "2025-10-20T00:00:00Z",
          count: 423,
          orb: 254,
          nfc: 169,
        },
        {
          start: "2025-10-20T00:00:00Z",
          end: "2025-10-21T00:00:00Z",
          count: 445,
          orb: 267,
          nfc: 178,
        },
        {
          start: "2025-10-21T00:00:00Z",
          end: "2025-10-22T00:00:00Z",
          count: 467,
          orb: 280,
          nfc: 187,
        },
        {
          start: "2025-10-22T00:00:00Z",
          end: "2025-10-23T00:00:00Z",
          count: 490,
          orb: 294,
          nfc: 196,
        },
        {
          start: "2025-10-23T00:00:00Z",
          end: "2025-10-24T00:00:00Z",
          count: 512,
          orb: 307,
          nfc: 205,
        },
        {
          start: "2025-10-24T00:00:00Z",
          end: "2025-10-25T00:00:00Z",
          count: 528,
          orb: 317,
          nfc: 211,
        },
      ],
    },
    earnings: {
      total: {
        inWLD: "528000000000000000000",
        inCurrency: 528,
      },
      totalInCurrency: 528.0,
      totalByType: {
        orb: {
          inWLD: "316800000000000000000", // 60% of 528 WLD
          inCurrency: 316.8,
        },
        nfc: {
          inWLD: "211200000000000000000", // 40% of 528 WLD
          inCurrency: 211.2,
        },
      },
      periods: [
        {
          start: "2025-10-01T00:00:00Z",
          end: "2025-10-02T00:00:00Z",
          amount: {
            inWLD: "22000000000000000000", // 22 WLD
            inCurrency: 22.0,
          },
          amountInCurrency: 22.0,
          amountByType: {
            orb: { inWLD: "13200000000000000000", inCurrency: 13.2 },
            nfc: { inWLD: "8800000000000000000", inCurrency: 8.8 },
          },
        },
        {
          start: "2025-10-02T00:00:00Z",
          end: "2025-10-03T00:00:00Z",
          amount: {
            inWLD: "45000000000000000000", // 45 WLD
            inCurrency: 45.0,
          },
          amountInCurrency: 45.0,
          amountByType: {
            orb: { inWLD: "27000000000000000000", inCurrency: 27.0 },
            nfc: { inWLD: "18000000000000000000", inCurrency: 18.0 },
          },
        },
        {
          start: "2025-10-03T00:00:00Z",
          end: "2025-10-04T00:00:00Z",
          amount: {
            inWLD: "67000000000000000000", // 67 WLD
            inCurrency: 67.0,
          },
          amountInCurrency: 67.0,
          amountByType: {
            orb: { inWLD: "40200000000000000000", inCurrency: 40.2 },
            nfc: { inWLD: "26800000000000000000", inCurrency: 26.8 },
          },
        },
        {
          start: "2025-10-04T00:00:00Z",
          end: "2025-10-05T00:00:00Z",
          amount: {
            inWLD: "89000000000000000000", // 89 WLD
            inCurrency: 89.0,
          },
          amountInCurrency: 89.0,
          amountByType: {
            orb: { inWLD: "53400000000000000000", inCurrency: 53.4 },
            nfc: { inWLD: "35600000000000000000", inCurrency: 35.6 },
          },
        },
        {
          start: "2025-10-05T00:00:00Z",
          end: "2025-10-06T00:00:00Z",
          amount: {
            inWLD: "112000000000000000000", // 112 WLD
            inCurrency: 112.0,
          },
          amountInCurrency: 112.0,
          amountByType: {
            orb: { inWLD: "67200000000000000000", inCurrency: 67.2 },
            nfc: { inWLD: "44800000000000000000", inCurrency: 44.8 },
          },
        },
        {
          start: "2025-10-06T00:00:00Z",
          end: "2025-10-07T00:00:00Z",
          amount: {
            inWLD: "134000000000000000000", // 134 WLD
            inCurrency: 134.0,
          },
          amountInCurrency: 134.0,
          amountByType: {
            orb: { inWLD: "80400000000000000000", inCurrency: 80.4 },
            nfc: { inWLD: "53600000000000000000", inCurrency: 53.6 },
          },
        },
        {
          start: "2025-10-07T00:00:00Z",
          end: "2025-10-08T00:00:00Z",
          amount: {
            inWLD: "156000000000000000000", // 156 WLD
            inCurrency: 156.0,
          },
          amountInCurrency: 156.0,
          amountByType: {
            orb: { inWLD: "93600000000000000000", inCurrency: 93.6 },
            nfc: { inWLD: "62400000000000000000", inCurrency: 62.4 },
          },
        },
        {
          start: "2025-10-08T00:00:00Z",
          end: "2025-10-09T00:00:00Z",
          amount: {
            inWLD: "178000000000000000000", // 178 WLD
            inCurrency: 178.0,
          },
          amountInCurrency: 178.0,
          amountByType: {
            orb: { inWLD: "106800000000000000000", inCurrency: 106.8 },
            nfc: { inWLD: "71200000000000000000", inCurrency: 71.2 },
          },
        },
        {
          start: "2025-10-09T00:00:00Z",
          end: "2025-10-10T00:00:00Z",
          amount: {
            inWLD: "201000000000000000000", // 201 WLD
            inCurrency: 201.0,
          },
          amountInCurrency: 201.0,
          amountByType: {
            orb: { inWLD: "120600000000000000000", inCurrency: 120.6 },
            nfc: { inWLD: "80400000000000000000", inCurrency: 80.4 },
          },
        },
        {
          start: "2025-10-10T00:00:00Z",
          end: "2025-10-11T00:00:00Z",
          amount: {
            inWLD: "223000000000000000000", // 223 WLD
            inCurrency: 223.0,
          },
          amountInCurrency: 223.0,
          amountByType: {
            orb: { inWLD: "133800000000000000000", inCurrency: 133.8 },
            nfc: { inWLD: "89200000000000000000", inCurrency: 89.2 },
          },
        },
        {
          start: "2025-10-11T00:00:00Z",
          end: "2025-10-12T00:00:00Z",
          amount: {
            inWLD: "245000000000000000000", // 245 WLD
            inCurrency: 245.0,
          },
          amountInCurrency: 245.0,
          amountByType: {
            orb: { inWLD: "147000000000000000000", inCurrency: 147.0 },
            nfc: { inWLD: "98000000000000000000", inCurrency: 98.0 },
          },
        },
        {
          start: "2025-10-12T00:00:00Z",
          end: "2025-10-13T00:00:00Z",
          amount: {
            inWLD: "267000000000000000000", // 267 WLD
            inCurrency: 267.0,
          },
          amountInCurrency: 267.0,
          amountByType: {
            orb: { inWLD: "160200000000000000000", inCurrency: 160.2 },
            nfc: { inWLD: "106800000000000000000", inCurrency: 106.8 },
          },
        },
        {
          start: "2025-10-13T00:00:00Z",
          end: "2025-10-14T00:00:00Z",
          amount: {
            inWLD: "290000000000000000000", // 290 WLD
            inCurrency: 290.0,
          },
          amountInCurrency: 290.0,
          amountByType: {
            orb: { inWLD: "174000000000000000000", inCurrency: 174.0 },
            nfc: { inWLD: "116000000000000000000", inCurrency: 116.0 },
          },
        },
        {
          start: "2025-10-14T00:00:00Z",
          end: "2025-10-15T00:00:00Z",
          amount: {
            inWLD: "312000000000000000000", // 312 WLD
            inCurrency: 312.0,
          },
          amountInCurrency: 312.0,
          amountByType: {
            orb: { inWLD: "187200000000000000000", inCurrency: 187.2 },
            nfc: { inWLD: "124800000000000000000", inCurrency: 124.8 },
          },
        },
        {
          start: "2025-10-15T00:00:00Z",
          end: "2025-10-16T00:00:00Z",
          amount: {
            inWLD: "334000000000000000000", // 334 WLD
            inCurrency: 334.0,
          },
          amountInCurrency: 334.0,
          amountByType: {
            orb: { inWLD: "200400000000000000000", inCurrency: 200.4 },
            nfc: { inWLD: "133600000000000000000", inCurrency: 133.6 },
          },
        },
        {
          start: "2025-10-16T00:00:00Z",
          end: "2025-10-17T00:00:00Z",
          amount: {
            inWLD: "356000000000000000000", // 356 WLD
            inCurrency: 356.0,
          },
          amountInCurrency: 356.0,
          amountByType: {
            orb: { inWLD: "213600000000000000000", inCurrency: 213.6 },
            nfc: { inWLD: "142400000000000000000", inCurrency: 142.4 },
          },
        },
        {
          start: "2025-10-17T00:00:00Z",
          end: "2025-10-18T00:00:00Z",
          amount: {
            inWLD: "378000000000000000000", // 378 WLD
            inCurrency: 378.0,
          },
          amountInCurrency: 378.0,
          amountByType: {
            orb: { inWLD: "226800000000000000000", inCurrency: 226.8 },
            nfc: { inWLD: "151200000000000000000", inCurrency: 151.2 },
          },
        },
        {
          start: "2025-10-18T00:00:00Z",
          end: "2025-10-19T00:00:00Z",
          amount: {
            inWLD: "401000000000000000000", // 401 WLD
            inCurrency: 401.0,
          },
          amountInCurrency: 401.0,
          amountByType: {
            orb: { inWLD: "240600000000000000000", inCurrency: 240.6 },
            nfc: { inWLD: "160400000000000000000", inCurrency: 160.4 },
          },
        },
        {
          start: "2025-10-19T00:00:00Z",
          end: "2025-10-20T00:00:00Z",
          amount: {
            inWLD: "423000000000000000000", // 423 WLD
            inCurrency: 423.0,
          },
          amountInCurrency: 423.0,
          amountByType: {
            orb: { inWLD: "253800000000000000000", inCurrency: 253.8 },
            nfc: { inWLD: "169200000000000000000", inCurrency: 169.2 },
          },
        },
        {
          start: "2025-10-20T00:00:00Z",
          end: "2025-10-21T00:00:00Z",
          amount: {
            inWLD: "445000000000000000000", // 445 WLD
            inCurrency: 445.0,
          },
          amountInCurrency: 445.0,
          amountByType: {
            orb: { inWLD: "267000000000000000000", inCurrency: 267.0 },
            nfc: { inWLD: "178000000000000000000", inCurrency: 178.0 },
          },
        },
        {
          start: "2025-10-21T00:00:00Z",
          end: "2025-10-22T00:00:00Z",
          amount: {
            inWLD: "467000000000000000000", // 467 WLD
            inCurrency: 467.0,
          },
          amountInCurrency: 467.0,
          amountByType: {
            orb: { inWLD: "280200000000000000000", inCurrency: 280.2 },
            nfc: { inWLD: "186800000000000000000", inCurrency: 186.8 },
          },
        },
        {
          start: "2025-10-22T00:00:00Z",
          end: "2025-10-23T00:00:00Z",
          amount: {
            inWLD: "490000000000000000000", // 490 WLD
            inCurrency: 490.0,
          },
          amountInCurrency: 490.0,
          amountByType: {
            orb: { inWLD: "294000000000000000000", inCurrency: 294.0 },
            nfc: { inWLD: "196000000000000000000", inCurrency: 196.0 },
          },
        },
        {
          start: "2025-10-23T00:00:00Z",
          end: "2025-10-24T00:00:00Z",
          amount: {
            inWLD: "512000000000000000000", // 512 WLD
            inCurrency: 512.0,
          },
          amountInCurrency: 512.0,
          amountByType: {
            orb: { inWLD: "307200000000000000000", inCurrency: 307.2 },
            nfc: { inWLD: "204800000000000000000", inCurrency: 204.8 },
          },
        },
        {
          start: "2025-10-24T00:00:00Z",
          end: "2025-10-25T00:00:00Z",
          amount: {
            inWLD: "528000000000000000000", // 528 WLD
            inCurrency: 528.0,
          },
          amountInCurrency: 528.0,
          amountByType: {
            orb: { inWLD: "316800000000000000000", inCurrency: 316.8 },
            nfc: { inWLD: "211200000000000000000", inCurrency: 211.2 },
          },
        },
      ],
    },
  },
};

export const yearlyOverviewMock: AffiliateOverviewResponse = {
  result: {
    period: "year",
    verifications: {
      total: 3000,
      orb: 1800, // 60% of 3000
      nfc: 1200, // 40% of 3000
      periods: [
        {
          start: "2025-01-01T00:00:00Z",
          end: "2025-02-01T00:00:00Z",
          count: 250,
          orb: 150,
          nfc: 100,
        },
        {
          start: "2025-02-01T00:00:00Z",
          end: "2025-03-01T00:00:00Z",
          count: 500,
          orb: 300,
          nfc: 200,
        },
        {
          start: "2025-03-01T00:00:00Z",
          end: "2025-04-01T00:00:00Z",
          count: 750,
          orb: 450,
          nfc: 300,
        },
        {
          start: "2025-04-01T00:00:00Z",
          end: "2025-05-01T00:00:00Z",
          count: 1000,
          orb: 600,
          nfc: 400,
        },
        {
          start: "2025-05-01T00:00:00Z",
          end: "2025-06-01T00:00:00Z",
          count: 1250,
          orb: 750,
          nfc: 500,
        },
        {
          start: "2025-06-01T00:00:00Z",
          end: "2025-07-01T00:00:00Z",
          count: 1500,
          orb: 900,
          nfc: 600,
        },
        {
          start: "2025-07-01T00:00:00Z",
          end: "2025-08-01T00:00:00Z",
          count: 1750,
          orb: 1050,
          nfc: 700,
        },
        {
          start: "2025-08-01T00:00:00Z",
          end: "2025-09-01T00:00:00Z",
          count: 2000,
          orb: 1200,
          nfc: 800,
        },
        {
          start: "2025-09-01T00:00:00Z",
          end: "2025-10-01T00:00:00Z",
          count: 2250,
          orb: 1350,
          nfc: 900,
        },
        {
          start: "2025-10-01T00:00:00Z",
          end: "2025-11-01T00:00:00Z",
          count: 2500,
          orb: 1500,
          nfc: 1000,
        },
        {
          start: "2025-11-01T00:00:00Z",
          end: "2025-12-01T00:00:00Z",
          count: 2750,
          orb: 1650,
          nfc: 1100,
        },
        {
          start: "2025-12-01T00:00:00Z",
          end: "2026-01-01T00:00:00Z",
          count: 3000,
          orb: 1800,
          nfc: 1200,
        },
      ],
    },
    earnings: {
      total: {
        inWLD: "3000000000000000000000", // 3000 WLD in wei
        inCurrency: 3000,
      },
      totalInCurrency: 3000.0,
      totalByType: {
        orb: {
          inWLD: "1800000000000000000000", // 60% of 3000 WLD
          inCurrency: 1800.0,
        },
        nfc: {
          inWLD: "1200000000000000000000", // 40% of 3000 WLD
          inCurrency: 1200.0,
        },
      },
      periods: [
        {
          start: "2025-01-01T00:00:00Z",
          end: "2025-02-01T00:00:00Z",
          amount: {
            inWLD: "250000000000000000000", // 250 WLD
            inCurrency: 250.0,
          },
          amountInCurrency: 250.0,
          amountByType: {
            orb: { inWLD: "150000000000000000000", inCurrency: 150.0 },
            nfc: { inWLD: "100000000000000000000", inCurrency: 100.0 },
          },
        },
        {
          start: "2025-02-01T00:00:00Z",
          end: "2025-03-01T00:00:00Z",
          amount: {
            inWLD: "500000000000000000000", // 500 WLD
            inCurrency: 500.0,
          },
          amountInCurrency: 500.0,
          amountByType: {
            orb: { inWLD: "300000000000000000000", inCurrency: 300.0 },
            nfc: { inWLD: "200000000000000000000", inCurrency: 200.0 },
          },
        },
        {
          start: "2025-03-01T00:00:00Z",
          end: "2025-04-01T00:00:00Z",
          amount: {
            inWLD: "750000000000000000000", // 750 WLD
            inCurrency: 750.0,
          },
          amountInCurrency: 750.0,
          amountByType: {
            orb: { inWLD: "450000000000000000000", inCurrency: 450.0 },
            nfc: { inWLD: "300000000000000000000", inCurrency: 300.0 },
          },
        },
        {
          start: "2025-04-01T00:00:00Z",
          end: "2025-05-01T00:00:00Z",
          amount: {
            inWLD: "1000000000000000000000", // 1000 WLD
            inCurrency: 1000.0,
          },
          amountInCurrency: 1000.0,
          amountByType: {
            orb: { inWLD: "600000000000000000000", inCurrency: 600.0 },
            nfc: { inWLD: "400000000000000000000", inCurrency: 400.0 },
          },
        },
        {
          start: "2025-05-01T00:00:00Z",
          end: "2025-06-01T00:00:00Z",
          amount: {
            inWLD: "1250000000000000000000", // 1250 WLD
            inCurrency: 1250.0,
          },
          amountInCurrency: 1250.0,
          amountByType: {
            orb: { inWLD: "750000000000000000000", inCurrency: 750.0 },
            nfc: { inWLD: "500000000000000000000", inCurrency: 500.0 },
          },
        },
        {
          start: "2025-06-01T00:00:00Z",
          end: "2025-07-01T00:00:00Z",
          amount: {
            inWLD: "1500000000000000000000", // 1500 WLD
            inCurrency: 1500.0,
          },
          amountInCurrency: 1500.0,
          amountByType: {
            orb: { inWLD: "900000000000000000000", inCurrency: 900.0 },
            nfc: { inWLD: "600000000000000000000", inCurrency: 600.0 },
          },
        },
        {
          start: "2025-07-01T00:00:00Z",
          end: "2025-08-01T00:00:00Z",
          amount: {
            inWLD: "1750000000000000000000", // 1750 WLD
            inCurrency: 1750.0,
          },
          amountInCurrency: 1750.0,
          amountByType: {
            orb: { inWLD: "1050000000000000000000", inCurrency: 1050.0 },
            nfc: { inWLD: "700000000000000000000", inCurrency: 700.0 },
          },
        },
        {
          start: "2025-08-01T00:00:00Z",
          end: "2025-09-01T00:00:00Z",
          amount: {
            inWLD: "2000000000000000000000", // 2000 WLD
            inCurrency: 2000.0,
          },
          amountInCurrency: 2000.0,
          amountByType: {
            orb: { inWLD: "1200000000000000000000", inCurrency: 1200.0 },
            nfc: { inWLD: "800000000000000000000", inCurrency: 800.0 },
          },
        },
        {
          start: "2025-09-01T00:00:00Z",
          end: "2025-10-01T00:00:00Z",
          amount: {
            inWLD: "2250000000000000000000", // 2250 WLD
            inCurrency: 2250.0,
          },
          amountInCurrency: 2250.0,
          amountByType: {
            orb: { inWLD: "1350000000000000000000", inCurrency: 1350.0 },
            nfc: { inWLD: "900000000000000000000", inCurrency: 900.0 },
          },
        },
        {
          start: "2025-10-01T00:00:00Z",
          end: "2025-11-01T00:00:00Z",
          amount: {
            inWLD: "2500000000000000000000", // 2500 WLD
            inCurrency: 2500.0,
          },
          amountInCurrency: 2500.0,
          amountByType: {
            orb: { inWLD: "1500000000000000000000", inCurrency: 1500.0 },
            nfc: { inWLD: "1000000000000000000000", inCurrency: 1000.0 },
          },
        },
        {
          start: "2025-11-01T00:00:00Z",
          end: "2025-12-01T00:00:00Z",
          amount: {
            inWLD: "2750000000000000000000", // 2750 WLD
            inCurrency: 2750.0,
          },
          amountInCurrency: 2750.0,
          amountByType: {
            orb: { inWLD: "1650000000000000000000", inCurrency: 1650.0 },
            nfc: { inWLD: "1100000000000000000000", inCurrency: 1100.0 },
          },
        },
        {
          start: "2025-12-01T00:00:00Z",
          end: "2026-01-01T00:00:00Z",
          amount: {
            inWLD: "3000000000000000000000", // 3000 WLD
            inCurrency: 3000.0,
          },
          amountInCurrency: 3000.0,
          amountByType: {
            orb: { inWLD: "1800000000000000000000", inCurrency: 1800.0 },
            nfc: { inWLD: "1200000000000000000000", inCurrency: 1200.0 },
          },
        },
      ],
    },
  },
};
