import { describe, it, expect } from 'vitest';
import { derivePlaceholderFromDateFormat } from '../dateFormatHelpers';

describe('derivePlaceholderFromDateFormat', () => {
  it('returns "mm/dd/yyyy" when neither placeholder nor dateFormat is given', () => {
    expect(derivePlaceholderFromDateFormat(undefined, undefined)).toBe('mm/dd/yyyy');
  });

  it('returns explicit placeholder as-is, ignoring dateFormat', () => {
    expect(derivePlaceholderFromDateFormat('Select a date', 'Y-m-d')).toBe('Select a date');
  });

  it('returns explicit placeholder even when dateFormat is absent', () => {
    expect(derivePlaceholderFromDateFormat('dd/mm/yyyy', undefined)).toBe('dd/mm/yyyy');
  });

  it('converts "Y-m-d" to "yyyy-mm-dd"', () => {
    expect(derivePlaceholderFromDateFormat(undefined, 'Y-m-d')).toBe('yyyy-mm-dd');
  });

  it('converts "d/m/Y" to "dd/mm/yyyy"', () => {
    expect(derivePlaceholderFromDateFormat(undefined, 'd/m/Y')).toBe('dd/mm/yyyy');
  });

  it('converts "m/d/Y" to "mm/dd/yyyy" (default US format)', () => {
    expect(derivePlaceholderFromDateFormat(undefined, 'm/d/Y')).toBe('mm/dd/yyyy');
  });

  it('converts "y-m-d" (2-digit year) to "yy-mm-dd"', () => {
    expect(derivePlaceholderFromDateFormat(undefined, 'y-m-d')).toBe('yy-mm-dd');
  });

  it('converts "j/n/Y" (no leading zeros) to "d/m/yyyy"', () => {
    expect(derivePlaceholderFromDateFormat(undefined, 'j/n/Y')).toBe('d/m/yyyy');
  });

  it('preserves unknown tokens unchanged', () => {
    // 'Z' is not in the map — should pass through as-is
    expect(derivePlaceholderFromDateFormat(undefined, 'Y-m-dZ')).toBe('yyyy-mm-ddZ');
  });
});
