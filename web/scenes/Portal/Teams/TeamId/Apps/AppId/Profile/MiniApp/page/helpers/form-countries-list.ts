import { countries } from "countries-list";

const unavailableCountries = [
  "AF", // Afghanistan
  "AL", // Albania
  "DZ", // Algeria
  "BD", // Bangladesh
  "BY", // Belarus
  "BO", // Bolivia
  "BA", // Bosnia and Herzegovina
  "BI", // Burundi
  "KH", // Cambodia
  "CF", // Central African Republic
  "CN", // China
  "CU", // Cuba
  "CD", // Democratic Republic of the Congo
  "EG", // Egypt
  "ER", // Eritrea
  "ET", // Ethiopia
  "IR", // Iran
  "IQ", // Iraq
  "XK", // Kosovo
  "LB", // Lebanon
  "LY", // Libya
  "MW", // Malawi
  "MV", // Maldives
  "ML", // Mali
  "ME", // Montenegro
  "MM", // Myanmar
  "NP", // Nepal
  "KP", // North Korea
  "MK", // North Macedonia
  "PS", // Palestine State
  "QA", // Qatar
  "RU", // Russia
  "RS", // Serbia
  "SO", // Somalia
  "SS", // South Sudan
  "SD", // Sudan
  "SY", // Syria
  "TZ", // Tanzania
  "VE", // Venezuela
  "YE", // Yemen
];

export const formCountriesList = () =>
  Object.entries(countries)
    .map(([key, value]) => ({
      label: value.name,
      value: key,
    }))
    .filter(({ value }) => !unavailableCountries.includes(value));
