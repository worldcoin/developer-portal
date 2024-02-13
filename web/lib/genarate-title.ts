export const generateMetaTitle = (params?: {
  left: string;
  right?: string;
}) => {
  const { left, right = "Developer portal" } = params || {};
  return left ? `${left} | ${right}` : right;
};
