"use client";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";

type Props = {
  countries: { countryCode: string; asset: string; amount: number }[];
  loading: boolean;
};

export const CountryList = (props: Props) => {
  if (props.loading) {
    return (
      <div className="w-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="flex h-6 items-center gap-3">
              <Skeleton width={24} height={24} className="rounded-full" />
              <Skeleton width={80} />
            </div>
            <Skeleton width={44} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="w-full">
      {props.countries.map((country) => (
        <div
          key={country.countryCode}
          className="flex items-center justify-between gap-3 py-2.5"
        >
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
              {country.countryCode === "Global" ? (
                <IconFrame className="bg-blue-500 text-grey-0">
                  <IdentificationIcon />
                </IconFrame>
              ) : (
                <Image
                  src={`/icons/flags/${country.countryCode}.svg`}
                  alt={`${country.countryCode} flag`}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <Typography variant={TYPOGRAPHY.M3}>
              {country.countryCode}
            </Typography>
          </div>
          <Typography variant={TYPOGRAPHY.M3}>
            {country.amount} {country.asset}
          </Typography>
        </div>
      ))}
    </div>
  );
};
