export const CategoryTranslations: Record<string, Record<string, string>> = {
  en: {
    social: "Social",
    gaming: "Gaming",
    business: "Business",
    finance: "Finance",
    productivity: "Productivity",
    other: "Other",
    tokens: "Tokens",
    external: "External",
    earn: "Earn",
  },
  ca: {
    social: "Social",
    gaming: "Jocs",
    business: "Negocis",
    finance: "Finances",
    productivity: "Productivitat",
    other: "Altres",
    tokens: "Tokens",
    external: "Extern",
    earn: "Guanyar",
  },
  zh_CN: {
    social: "社交",
    gaming: "游戏",
    business: "商业",
    finance: "金融",
    productivity: "生产力",
    other: "其他",
    tokens: "代币",
    external: "外部",
    earn: "收益",
  },
  fr: {
    social: "Social",
    gaming: "Jeux",
    business: "Affaires",
    finance: "Finance",
    productivity: "Productivité",
    other: "Autre",
    tokens: "Jetons",
    external: "Externe",
    earn: "Gagner",
  },
  de: {
    social: "Sozial",
    gaming: "Spiele",
    business: "Geschäft",
    finance: "Finanzen",
    productivity: "Produktivität",
    other: "Andere",
    tokens: "Token",
    external: "Extern",
    earn: "Verdienen",
  },
  hi: {
    social: "सामाजिक",
    gaming: "गेमिंग",
    business: "व्यापार",
    finance: "वित्त",
    productivity: "उत्पादकता",
    other: "अन्य",
    tokens: "टोकन",
    external: "बाहरी",
    earn: "कमाई",
  },
  ja: {
    social: "ソーシャル",
    gaming: "ゲーム",
    business: "ビジネス",
    finance: "ファイナンス",
    productivity: "生産性",
    other: "その他",
    tokens: "トークン",
    external: "外部",
    earn: "稼ぐ",
  },
  ko: {
    social: "소셜",
    gaming: "게임",
    business: "비즈니스",
    finance: "재무",
    productivity: "생산성",
    other: "기타",
    tokens: "토큰",
    external: "외부",
    earn: "수익",
  },
  pl: {
    social: "Społeczność",
    gaming: "Gry",
    business: "Biznes",
    finance: "Finanse",
    productivity: "Produktywność",
    other: "Inne",
    tokens: "Tokeny",
    external: "Zewnętrzny",
    earn: "Zarabiaj",
  },
  pt: {
    social: "Social",
    gaming: "Jogos",
    business: "Negócios",
    finance: "Finanças",
    productivity: "Produtividade",
    other: "Outros",
    tokens: "Tokens",
    external: "Externo",
    earn: "Ganhar",
  },
  es: {
    social: "Social",
    gaming: "Juegos",
    business: "Negocios",
    finance: "Finanzas",
    productivity: "Productividad",
    other: "Otro",
    tokens: "Tokens",
    external: "Externo",
    earn: "Ganar",
  },
  es_419: {
    social: "Social",
    gaming: "Juegos",
    business: "Negocios",
    finance: "Finanzas",
    productivity: "Productividad",
    other: "Otro",
    tokens: "Tokens",
    external: "Externo",
    earn: "Ganar",
  },
};

export const Categories = [
  { name: "Social", id: "social" },
  { name: "Gaming", id: "gaming" },
  { name: "Business", id: "business" },
  { name: "Finance", id: "finance" },
  { name: "Productivity", id: "productivity" },
  { name: "Other", id: "other" },
  { name: "Tokens", id: "tokens" },
  { name: "External", id: "external" },
  { name: "Earn", id: "earn" },
] as const;

export const CategoryNameIterable = Categories.map((category) => category.name);

export const getLocalisedCategory = (name: string, locale: string) => {
  if (Object.keys(CategoryTranslations).indexOf(locale) === -1) {
    console.warn("Missing locale, falling back to default: ", { locale });
    locale = "en";
  }
  const defaultLocale = locale || "en";
  const translation = CategoryTranslations[defaultLocale];
  const id = name.toLowerCase();
  return {
    id: id,
    name: translation?.[id] ?? CategoryTranslations["en"][id],
  };
};

export const getAllLocalisedCategories = (locale: string) => {
  const defaultLocale = locale || "en";
  return Categories.map((category) =>
    getLocalisedCategory(category.name, defaultLocale),
  );
};
