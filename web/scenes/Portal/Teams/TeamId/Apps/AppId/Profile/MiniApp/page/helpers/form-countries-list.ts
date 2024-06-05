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

const supportedLanguages = [
  {
    label: "English",
    value: "en",
  },
  {
    label: "Catalan",
    value: "ca",
  },
  {
    label: "Chinese Simplified",
    value: "zh_CN",
  },
  {
    label: "French",
    value: "fr",
  },
  {
    label: "German",
    value: "de",
  },
  {
    label: "Hindi",
    value: "hi",
  },
  {
    label: "Japanese",
    value: "ja",
  },
  {
    label: "Korean",
    value: "ko",
  },
  {
    label: "Polish",
    value: "pl",
  },
  {
    label: "Portuguese",
    value: "pt",
  },
  {
    label: "Spanish",
    value: "es",
  },
  {
    label: "Spanish (Latin America)",
    value: "es_419",
  },
];

export const formCountriesList = () =>
  Object.entries(countries)
    .map(([key, value]) => ({
      label: value.name,
      value: key,
    }))
    .filter(({ value }) => !unavailableCountries.includes(value));

export const formLanguagesList = () => supportedLanguages;
