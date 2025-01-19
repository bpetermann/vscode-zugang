import { SourceLocation } from '@babel/types';
import { isRatioOk } from 'hue-check';
import { DiagnosticSeverity } from 'vscode';
import { EM, PROBLEMATIC_FONTS, PX, REM } from '../../utils/constants';
import { messages } from '../../utils/messages';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Visitor } from './Validator';

type StyleValue = string | number | boolean;
type Location = SourceLocation | null | undefined;

export class StyleValidator implements Visitor<Diagnostic[]> {
  private style: Record<string, StyleValue> = {};
  private loc: Location = undefined;

  validate(node: TSXElement): Diagnostic[] {
    this.style = node.style;
    this.loc = node.loc;

    return [
      this.checkColorContrast(),
      this.checkFontSize(),
      this.checkFontFamily(),
      this.checkLineHeight(),
    ].filter((error) => error instanceof Diagnostic);
  }

  validateImage(_node: TSXElement): Diagnostic[] {
    return [];
  }

  private checkColorContrast(): Diagnostic | undefined {
    const { color, backgroundColor } = this.style;

    if (
      color &&
      backgroundColor &&
      !isRatioOk(`${backgroundColor}`, `${color}`)
    ) {
      return new Diagnostic(messages.style.color, this.loc);
    }
  }

  private checkFontSize(): Diagnostic | undefined {
    const { fontSize } = this.style;

    if (fontSize && !this.isFontSizeSufficent(fontSize.toString())) {
      return new Diagnostic(messages.style.font, this.loc);
    }
  }

  private checkFontFamily(): Diagnostic | undefined {
    const { fontFamily } = this.style;

    if (this.isFontProblematic(fontFamily?.toString() || '')) {
      return new Diagnostic(
        messages.style.family + fontFamily,
        this.loc,
        DiagnosticSeverity.Hint
      );
    }
  }

  private checkLineHeight(): Diagnostic | undefined {
    const { fontSize, lineHeight } = this.style;

    if (
      fontSize &&
      lineHeight &&
      typeof lineHeight !== 'boolean' &&
      typeof fontSize !== 'boolean' &&
      !this.isLineHeightSufficient(lineHeight, fontSize)
    ) {
      return new Diagnostic(messages.style.height, this.loc);
    }
  }

  private isFontProblematic(fontFamily: string): boolean {
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

  private isFontSizeSufficent(
    size: string = '',
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

  private isLineHeightSufficient(
    lineHeight: string | number,
    fontSize: string | number
  ): boolean {
    const fontSizeValue = this.parseValue(fontSize, 16);
    const lineHeightValue = this.parseValue(
      lineHeight.toString(),
      fontSizeValue
    );

    return lineHeightValue >= fontSizeValue * 1.5;
  }

  private parseValue(value: string | number, reference: number = 0): number {
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
