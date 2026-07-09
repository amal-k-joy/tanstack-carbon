/**
 * Maps Flatpickr dateFormat tokens to their human-readable placeholder equivalents.
 * Only the tokens relevant to date input placeholders are included.
 * Reference: https://flatpickr.js.org/formatting/
 */
const FLATPICKR_TOKEN_TO_PLACEHOLDER = {
  Y: 'yyyy',
  y: 'yy',
  m: 'mm',
  n: 'm',
  d: 'dd',
  j: 'd',
};

/**
 * Derives a placeholder string from a Flatpickr dateFormat string.
 *
 * If a placeholder was explicitly provided, it is returned as-is.
 * If not, each recognised Flatpickr token in dateFormat is swapped for its
 * human-readable equivalent (e.g. "Y-m-d" → "yyyy-mm-dd").
 * Separator characters (-, /, ., space) are preserved unchanged.
 * Falls back to "mm/dd/yyyy" when neither placeholder nor dateFormat is given.
 *
 * @param {string|undefined} placeholder - Explicit placeholder override
 * @param {string|undefined} dateFormat  - Flatpickr format string (e.g. "Y-m-d")
 * @returns {string}
 */
export const derivePlaceholderFromDateFormat = (placeholder, dateFormat) => {
  if (placeholder !== undefined) {
    return placeholder;
  }
  if (!dateFormat) {
    return 'mm/dd/yyyy';
  }
  return dateFormat
    .split('')
    .map((char) => FLATPICKR_TOKEN_TO_PLACEHOLDER[char] ?? char)
    .join('');
};
