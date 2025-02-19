export const CategoryTranslations: Record<
  string,
  Record<Category["id"], string>
> = {
  en: {
    social: "Social",
    gaming: "Gaming",
    business: "Business",
    finance: "Finance",
    productivity: "Productivity",
    other: "Other",
    tokens: "Tokens",
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
    earn: "赚",
    ai: "人工智能",
  },
  fr: {
    social: "Social",
    gaming: "Jeux",
    business: "Business",
    finance: "Finance",
    productivity: "Productivité",
    other: "Autre",
    tokens: "Tokens",
    earn: "Gagner",
    ai: "IA",
  },
  de: {
    social: "Soziales",
    gaming: "Gaming",
    business: "Business",
    finance: "Finanzen",
    productivity: "Produktivität",
    other: "Sonstiges",
    tokens: "Token",
    earn: "Verdienen",
    ai: "AI",
  },
  hi: {
    social: "सामाजिक",
    gaming: "गेमिंग",
    business: "व्यापार",
    finance: "वित्त",
    productivity: "उत्पादकता",
    other: "अन्य",
    tokens: "टोकन",
    earn: "कमाना",
    ai: "कृत्रिम बुद्धिमत्ता",
  },
  ja: {
    social: "ソーシャル",
    gaming: "ゲーミング",
    business: "ビジネス",
    finance: "ファイナンス",
    productivity: "生産性",
    other: "その他",
    tokens: "トークン",
    earn: "稼ぐ",
    ai: "AI",
  },
  ko: {
    social: "소셜",
    gaming: "게이밍",
    business: "비즈니스",
    finance: "금융",
    productivity: "생산성",
    other: "기타",
    tokens: "토큰",
    earn: "받기",
    ai: "AI",
  },
  pl: {
    social: "Społeczność",
    gaming: "Gry",
    business: "Biznes",
    finance: "Finanse",
    productivity: "Produktywność",
    other: "Inne",
    tokens: "Tokeny",
    earn: "Zarabiaj",
    ai: "AI",
  },
  pt: {
    social: "Social",
    gaming: "Jogos",
    business: "Negócios",
    finance: "Finanças",
    productivity: "Produtividade",
    other: "Outro",
    tokens: "Tokens",
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
    earn: "Ganar",
    ai: "IA",
  },
  es_419: {
    social: "Social",
    gaming: "Juegos",
    business: "Negocio",
    finance: "Finanzas",
    productivity: "Productividad",
    other: "Otros",
    tokens: "Tokens",
    earn: "Gana",
    ai: "IA",
  },
  ms: {
    social: "Sosial",
    gaming: "Permainan",
    business: "Perniagaan",
    finance: "Kewangan",
    productivity: "Produktiviti",
    other: "Lain-Lain-lain",
    tokens: "Token",
    earn: "Dapatkan",
    ai: "Kecerdasan AI",
  },
  th: {
    social: "โซเชียล",
    gaming: "การเล่นเกม",
    business: "ธุรกิจ",
    finance: "การเงิน",
    productivity: "การผลิต",
    other: "อื่นๆ",
    tokens: "โทเค็น",
    earn: "รับรายได้",
    ai: "AI",
  },
  id: {
    social: "Sosial",
    gaming: "Gaming",
    business: "Bisnis",
    finance: "Keuangan",
    productivity: "Produktivitas",
    other: "Lainnya",
    tokens: "Token",
    earn: "Hasilkan",
    ai: "AI",
  },
};

export const Categories = [
  {
    name: "AI",
    id: "ai",
    icon_url: `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/category-icons/ai.png`,
  },
  {
    name: "Social",
    id: "social",
    icon_url: `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/category-icons/social.png`,
  },
  {
    name: "Gaming",
    id: "gaming",
    icon_url: `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/category-icons/gaming.png`,
  },
  {
    name: "Business",
    id: "business",
    icon_url: `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/category-icons/business.png`,
  },
  {
    name: "Finance",
    id: "finance",
    icon_url: `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/category-icons/finance.png`,
  },
  {
    name: "Productivity",
    id: "productivity",
    icon_url: `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/category-icons/productivity.png`,
  },
  {
    name: "Tokens",
    id: "tokens",
    icon_url: `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/category-icons/tokens.png`,
  },
  {
    name: "Earn",
    id: "earn",
    icon_url: `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/category-icons/earn.png`,
  },
  {
    name: "Other",
    id: "other",
    icon_url: `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/category-icons/other.png`,
  },
] as const;

export type Category = (typeof Categories)[number];

export const CategoryNameIterable: Category["name"][] = Categories.map(
  (category) => category.name,
);

export const CategoryNameToId = Categories.reduce(
  (acc, { name, id }) => {
    acc[name] = id;
    return acc;
  },
  {} as Record<Category["name"], Category["id"]>,
);

export const getLocalisedCategory = (
  name: Category["name"],
  locale: string,
) => {
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

export const getAllLocalisedCategoriesWithUrls = (locale: string) => {
  const defaultLocale = locale || "en";
  return Categories.map((category) => {
    const { id, name } = getLocalisedCategory(category.name, defaultLocale);
    return { id, name, icon_url: category.icon_url };
  });
};
