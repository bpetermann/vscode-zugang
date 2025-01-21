import { EM, PROBLEMATIC_FONTS, PX, REM } from './constants';

export class Style {
  /**
   * Checks if the given font family is problematic based on a predefined list of fonts.
   *
   * @param {string} fontFamily - The font family string to check.
   * @returns {boolean} - `true` if the font family is problematic, otherwise `false`.
   */
  static isFontProblematic(fontFamily: string): boolean {
    const problematicFontsLower = PROBLEMATIC_FONTS.map((font) =>
      font.toLowerCase()
    );
    return fontFamily
      .toLowerCase()
      .split(',')
      .some((font) =>
        problematicFontsLower.includes(font.trim().replace(/["']/g, ''))
      );
  }

  /**
   * Checks if the given font size is sufficient based on minimum thresholds.
   *
   * @param {string} [size] - The font size string to check (e.g., '16px', '1em').
   * @param {number} [minPx=9] - The minimum font size in pixels.
   * @param {number} [minEm=0.563] - The minimum font size in em units.
   * @returns {boolean} - `true` if the font size meets or exceeds the minimum thresholds, otherwise `false`.
   */
  static isFontSizeSufficent(
    size: string,
    minPx: number = 9,
    minEm: number = 0.563
  ): boolean {
    return (
      (size && !isNaN(+size) && +size >= minPx) ||
      (size?.endsWith(PX) && +size.split(PX)[0] >= minPx) ||
      (size?.endsWith(EM) && +size.split(EM)[0] >= minEm) ||
      (size?.endsWith(REM) && +size.split(REM)[0] >= minEm)
    );
  }

  /**
   * Checks if the line height is sufficient relative to the font size.
   *
   * @param {string | number} lineHeight - The line height to check (e.g., '1.5em', 24).
   * @param {string | number} fontSize - The font size to use as a reference (e.g., '16px', 16).
   * @returns {boolean} - `true` if the line height is sufficient, otherwise `false`.
   */
  static isLineHeightSufficient(
    lineHeight: string | number,
    fontSize: string | number
  ): boolean {
    const fontSizeValue = Style.parseValue(fontSize, 16);
    const lineHeightValue = Style.parseValue(
      lineHeight.toString(),
      fontSizeValue
    );

    return lineHeightValue >= fontSizeValue * 1.5;
  }

  /**
   * Parses a value string or number and converts it to a numeric value based on a reference size.
   *
   * @private
   * @param {string | number} value - The value to parse (e.g., '16px', '1em', 100).
   * @param {number} [reference=0] - The reference size for relative units like em or percentage.
   * @returns {number} - The parsed numeric value.
   */
  private static parseValue(
    value: string | number,
    reference: number = 0
  ): number {
    switch (true) {
      case typeof value === 'number':
        return value;
      case typeof value === 'string' && value.endsWith('px'):
        return parseFloat(value);
      case typeof value === 'string' && value.endsWith('em'):
        return parseFloat(value) * reference;
      case typeof value === 'string' && value.endsWith('%'):
        return (parseFloat(value) / 100) * reference;
      default:
        return parseFloat(value) * reference || parseFloat(value);
    }
  }
}
