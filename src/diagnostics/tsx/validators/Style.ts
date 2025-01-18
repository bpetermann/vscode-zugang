import { isRatioOk } from 'hue-check';
import { EM, PX, REM } from '../../utils/constants';
import { messages } from '../../utils/messages';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Visitor } from './Validator';

export class StyleValidator implements Visitor<Diagnostic[]> {
  validate(node: TSXElement): Diagnostic[] {
    return [
      this.checkColorContrast(node),
      this.checkFontSize(node),
      this.checkLineHeight(node),
    ].filter((error) => error instanceof Diagnostic);
  }

  validateImage(_node: TSXElement): Diagnostic[] {
    return [];
  }

  private checkColorContrast(node: TSXElement): Diagnostic | undefined {
    const { color, backgroundColor } = node.style;

    if (
      !color ||
      !backgroundColor ||
      isRatioOk(`${backgroundColor}`, `${color}`)
    ) {
      return undefined;
    }

    return new Diagnostic(messages.style.color, node.loc);
  }

  private checkFontSize(node: TSXElement): Diagnostic | undefined {
    const { fontSize } = node.style;

    if (!fontSize || this.isFontSizeSufficent(fontSize.toString())) {
      return;
    }

    return new Diagnostic(messages.style.font, node.loc);
  }

  private checkLineHeight(node: TSXElement): Diagnostic | undefined {
    const { fontSize, lineHeight } = node.style;

    if (
      !fontSize ||
      !lineHeight ||
      typeof lineHeight === 'boolean' ||
      typeof fontSize === 'boolean' ||
      this.isLineHeightSufficient(lineHeight, fontSize)
    ) {
      return;
    }

    return new Diagnostic(messages.style.height, node.loc);
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
