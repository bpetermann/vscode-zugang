import { isRatioOk } from 'hue-check';
import { DiagnosticSeverity } from 'vscode';
import { messages } from '../../utils/messages';
import { Style } from '../../utils/Style';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Location, Visitor } from './Validator';

type StyleValue = string | number | boolean;

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

    if (fontSize && !Style.isFontSizeSufficent(fontSize.toString())) {
      return new Diagnostic(messages.style.font, this.loc);
    }
  }

  private checkFontFamily(): Diagnostic | undefined {
    const { fontFamily } = this.style;

    if (Style.isFontProblematic(fontFamily?.toString() || '')) {
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
      !Style.isLineHeightSufficient(lineHeight, fontSize)
    ) {
      return new Diagnostic(messages.style.height, this.loc);
    }
  }
}
