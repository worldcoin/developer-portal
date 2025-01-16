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
    ai: "AI",
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
    ai: "Intel·ligència Artificial",
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
    earn: "赚",
    ai: "人工智能",
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
    ai: "Intelligence Artificielle",
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
    ai: "Künstliche Intelligenz",
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
    earn: "कमाना",
    ai: "कृत्रिम बुद्धिमत्ता",
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
    ai: "人工知能",
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
    earn: "벌다",
    ai: "인공지능",
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
    ai: "Sztuczna inteligencja",
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
    ai: "IA",
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
    ai: "IA",
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
    ai: "IA",
  },
};

export const Categories = [
  { name: "AI", id: "ai" },
  { name: "Social", id: "social" },
  { name: "Gaming", id: "gaming" },
  { name: "Business", id: "business" },
  { name: "Finance", id: "finance" },
  { name: "Productivity", id: "productivity" },
  { name: "Tokens", id: "tokens" },
  { name: "Earn", id: "earn" },
  { name: "Other", id: "other" },
  { name: "External", id: "external" },
] as const;

export const CategoryNameIterable = Categories.map((category) => category.name);

export const CategoryNameToId = Categories.reduce(
  (acc, { name, id }) => {
    acc[name] = id;
    return acc;
  },
  {} as Record<string, string>,
);

export const getLocalisedCategory = (name: string, locale: string) => {
  if (Object.keys(CategoryTranslations).indexOf(locale) === -1) {
    console.warn("Missing locale, falling back to default: ", { locale });
    locale = "en";
  }
  const defaultLocale = locale || "en";
  const translation = CategoryTranslations[defaultLocale];
  const id = CategoryNameToId[name];
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
