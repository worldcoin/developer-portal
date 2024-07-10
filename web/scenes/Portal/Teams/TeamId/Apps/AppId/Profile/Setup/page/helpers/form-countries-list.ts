import { countries } from "countries-list";

const allowedCountries = [
  "AD", // Andorra
  "AO", // Angola
  "AI", // Anguilla
  "AG", // Antigua and Barbuda
  "AR", // Argentina
  "AM", // Armenia
  "AW", // Aruba
  "AU", // Australia
  "AT", // Austria
  "AZ", // Azerbaijan
  "BS", // Bahamas
  "BH", // Bahrain
  "BB", // Barbados
  "BE", // Belgium
  "BZ", // Belize
  "BJ", // Benin
  "BM", // Bermuda
  "BT", // Bhutan
  "BW", // Botswana
  "BR", // Brazil
  "VG", // British Virgin Islands
  "BN", // Brunei
  "BG", // Bulgaria
  "BF", // Burkina Faso
  "CM", // Cameroon
  "CA", // Canada
  "KY", // Cayman Islands
  "TD", // Chad
  "CL", // Chile
  "CO", // Colombia
  "KM", // Comoros
  "CR", // Costa Rica
  "HR", // Croatia
  "CW", // Curacao
  "CY", // Cyprus
  "CZ", // Czechia
  "DK", // Denmark
  "DJ", // Djibouti
  "DM", // Dominica
  "DO", // Dominican Republic
  "EC", // Ecuador
  "SV", // El Salvador
  "GQ", // Equatorial Guinea
  "EE", // Estonia
  "SZ", // Eswatini
  "FJ", // Fiji
  "FI", // Finland
  "FR", // France
  "GA", // Gabon
  "GM", // Gambia
  "GE", // Georgia
  "DE", // Germany
  "GH", // Ghana
  "GR", // Greece
  "GL", // Greenland
  "GD", // Grenada
  "GP", // Guadeloupe
  "GT", // Guatemala
  "GN", // Guinea
  "GW", // Guinea-Bissau
  "GY", // Guyana
  "HT", // Haiti
  "HN", // Honduras
  "HK", // Hong Kong
  "HU", // Hungary
  "IS", // Iceland
  "IN", // India
  "ID", // Indonesia
  "IE", // Ireland
  "IL", // Israel
  "IT", // Italy
  "CI", // Ivory Coast
  "JM", // Jamaica
  "JP", // Japan
  "JO", // Jordan
  "KZ", // Kazakhstan
  "KE", // Kenya
  "KI", // Kiribati
  "KR", // Korea, Republic of
  "KW", // Kuwait
  "KG", // Kyrgyzstan
  "LA", // Laos
  "LV", // Latvia
  "LS", // Lesotho
  "LR", // Liberia
  "LI", // Liechtenstein
  "LT", // Lithuania
  "LU", // Luxembourg
  "MG", // Madagascar
  "MY", // Malaysia
  "MT", // Malta
  "MH", // Marshall Islands
  "MR", // Mauritania
  "MU", // Mauritius
  "MX", // Mexico
  "FM", // Micronesia
  "MD", // Moldova
  "MC", // Monaco
  "MN", // Mongolia
  "MA", // Morocco
  "MZ", // Mozambique
  "NA", // Namibia
  "NR", // Nauru
  "NL", // Netherlands
  "NZ", // New Zealand
  "NI", // Nicaragua
  "NE", // Niger
  "NG", // Nigeria
  "NO", // Norway
  "OM", // Oman
  "PK", // Pakistan
  "PW", // Palau
  "PA", // Panama
  "PG", // Papua New Guinea
  "PY", // Paraguay
  "PE", // Peru
  "PH", // Philippines
  "PL", // Poland
  "PT", // Portugal
  "PR", // Puerto Rico
  "RO", // Romania
  "RW", // Rwanda
  "KN", // Saint Kitts and Nevis
  "LC", // Saint Lucia
  "SX", // Saint Maarten
  "VC", // Saint Vincent and the Grenadines
  "WS", // Samoa
  "SM", // San Marino
  "ST", // Sao Tome and Principe
  "SA", // Saudi Arabia
  "SN", // Senegal
  "SC", // Seychelles
  "SL", // Sierra Leone
  "SG", // Singapore
  "SK", // Slovakia
  "SI", // Slovenia
  "SB", // Solomon Islands
  "ZA", // South Africa
  "ES", // Spain
  "LK", // Sri Lanka
  "SR", // Suriname
  "SE", // Sweden
  "CH", // Switzerland
  "TW", // Taiwan
  "TJ", // Tajikistan
  "TH", // Thailand
  "TL", // Timor-Leste
  "TG", // Togo
  "TO", // Tonga
  "TT", // Trinidad and Tobago
  "TN", // Tunisia
  "TR", // Turkey
  "TM", // Turkmenistan
  "TV", // Tuvalu
  "UG", // Uganda
  "UA", // Ukraine
  "AE", // United Arab Emirates
  "GB", // United Kingdom
  "US", // United States
  "UY", // Uruguay
  "UZ", // Uzbekistan
  "VU", // Vanuatu
  "VN", // Vietnam
  "ZM", // Zambia
  "ZW", // Zimbabwe
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
    .filter(({ value }) => allowedCountries.includes(value));

export const formLanguagesList = () => supportedLanguages;
