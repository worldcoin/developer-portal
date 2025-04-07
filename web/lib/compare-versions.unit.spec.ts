import { compareVersions } from './compare-versions';

describe('compareVersions', () => {
  it('different cases', () => {
    expect(compareVersions('', '')).toBe(0);
    expect(compareVersions('0', '0')).toBe(0);
    expect(compareVersions('0', '0.0')).toBe(0);
    expect(compareVersions('1', '0.5')).toBe(1);
    expect(compareVersions('1.2', '0.5')).toBe(1);
    expect(compareVersions('0.1', '0.0.2')).toBe(1);
    expect(compareVersions('0.1', '0.1.2')).toBe(-1);
    expect(compareVersions('0.0.1', '0')).toBe(1);
    expect(compareVersions('1.2.5', '1')).toBe(1);
    expect(compareVersions('0.0.1', '0.1')).toBe(-1);
    expect(compareVersions('0.0.1', '0.0.1')).toBe(0);
    expect(compareVersions('0.0.1', '0.0.2')).toBe(-1);
  });
});
