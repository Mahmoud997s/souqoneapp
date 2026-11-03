import { toSingleString } from '../routeParams';

describe('toSingleString', () => {
  it('returns trimmed string for non-empty string values', () => {
    expect(toSingleString('Toyota')).toBe('Toyota');
    expect(toSingleString('  Nissan  ')).toBe('Nissan');
  });

  it('returns undefined for empty and whitespace-only strings', () => {
    expect(toSingleString('')).toBeUndefined();
    expect(toSingleString('   ')).toBeUndefined();
    expect(toSingleString('\t\n')).toBeUndefined();
  });

  it('returns undefined for non-string scalar types', () => {
    expect(toSingleString(undefined)).toBeUndefined();
    expect(toSingleString(null)).toBeUndefined();
    expect(toSingleString(123)).toBeUndefined();
    expect(toSingleString(true)).toBeUndefined();
    expect(toSingleString({})).toBeUndefined();
  });

  it('scans arrays in order and selects the first trimmed non-empty string', () => {
    expect(toSingleString(['', 'Toyota'])).toBe('Toyota');
    expect(toSingleString(['   ', '  Mazda  ', 'Honda'])).toBe('Mazda');
    expect(toSingleString(['Lexus', 'Audi'])).toBe('Lexus');
  });

  it('skips non-string elements in arrays', () => {
    expect(toSingleString([1, 'x'])).toBe('x');
    expect(toSingleString([null, undefined, 42, 'valid'])).toBe('valid');
  });

  it('returns undefined for empty, whitespace-only, or non-string arrays', () => {
    expect(toSingleString([])).toBeUndefined();
    expect(toSingleString(['', '   '])).toBeUndefined();
    expect(toSingleString([1, 2, 3])).toBeUndefined();
    expect(toSingleString([null, undefined])).toBeUndefined();
  });

  it('returns undefined for nested arrays without throwing', () => {
    expect(toSingleString([['nested']])).toBeUndefined();
  });
});
