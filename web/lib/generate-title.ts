export const generateMetaTitle = (params?: {
  left: string;
  right?: string;
}) => {
  const { left, right = "Developer Portal" } = params || {};
  return left ? `${left} | ${right}` : right;
};
