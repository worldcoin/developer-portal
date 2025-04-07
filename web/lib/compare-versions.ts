/**
 * Compares two version strings in the format 'x.y.z'.
 *
 * @param {string} version1 - The first version string to compare.
 * @param {string} version2 - The second version string to compare.
 * @returns {number} - Returns 0 if the versions are equal, 1 if version1 is greater, and -1 if version2 is greater.
 *
 * @example
 * // Returns 0
 * compareVersions('1.0.0', '1.0.0');
 *
 * @example
 * // Returns 1
 * compareVersions('2.1.0', '2.0.1');
 *
 * @example
 * // Returns -1
 * compareVersions('1.0.0', '1.0.1');
 *
 * @remarks
 * The function considers only the first three parts of the version strings. If a part is missing, it is treated as 0.
 */
export function compareVersions(version1: string, version2: string): number {
  if (version1 === version2) return 0;

  const v1 = version1
    .split('.')
    .slice(0, 3)
    .map((n) => parseInt(n, 10));
  const v2 = version2
    .split('.')
    .slice(0, 3)
    .map((n) => parseInt(n, 10));

  const length = Math.max(v1.length, v2.length);

  for (let i = 0; i < length; i++) {
    const n1 = v1[i] ?? 0;
    const n2 = v2[i] ?? 0;

    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }

  return 0;
}
