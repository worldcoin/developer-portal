import { countries } from "countries-list";

type AvailableCountriesProps = {
  countryCodes?: string[] | null;
};

const getCountryName = (countryCode: string) =>
  countries[countryCode.toUpperCase() as keyof typeof countries]?.name ??
  countryCode;

export const AvailableCountries = ({
  countryCodes,
}: AvailableCountriesProps) => (
  <p className="mt-1 text-12 text-grey-500">
    <span className="font-medium">Available countries:</span>{" "}
    {countryCodes?.length
      ? countryCodes.map(getCountryName).join(", ")
      : "No countries selected."}
  </p>
);
