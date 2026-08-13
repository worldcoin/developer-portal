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
  <section className="mt-6">
    <h3 className="text-14 font-semibold text-grey-900">Available countries</h3>
    <p className="mt-2 text-14 text-grey-500">
      {countryCodes?.length
        ? countryCodes.map(getCountryName).join(", ")
        : "No countries selected."}
    </p>
  </section>
);
