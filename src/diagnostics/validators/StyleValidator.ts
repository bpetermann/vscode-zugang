import { isRatioOk } from 'hue-check';
import { DiagnosticSeverity } from 'vscode';
import {
  BG_COLOR,
  FONT_FAMILY,
  FONT_SIZE,
  LINE_HEIGHT,
  STYLE_TAGS,
} from '../utils/constants';
import { messages } from '../utils/messages';
import { Style } from '../utils/Style';
import { AccessibilityNode } from '../utils/AccessibilityNode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';

export class StyleValidator implements RuleValidator {
  readonly tags: readonly string[] = STYLE_TAGS;

  validate(node: AccessibilityNode, _context: ValidationContext): RuleViolation[] {
    const style = node.style;
    if (!Object.keys(style).length) {
      return [];
    }

    const violations: RuleViolation[] = [];
    const contrast = this.checkContrast(style);
    if (contrast) {
      violations.push(contrast);
    }
    const fontSize = this.checkFontSize(style);
    if (fontSize) {
      violations.push(fontSize);
    }
    const lineHeight = this.checkLineHeight(style);
    if (lineHeight) {
      violations.push(lineHeight);
    }
    const fontFamily = this.checkFontFamily(style);
    if (fontFamily) {
      violations.push(fontFamily);
    }
    return violations;
  }

  private checkContrast(
    style: Record<string, string | number | boolean>
  ): RuleViolation | undefined {
    const bg = style[BG_COLOR];
    const color = style.color;
    if (bg && color && !isRatioOk(`${bg}`, `${color}`)) {
      return { message: messages.style.color };
    }
  }

  private checkFontSize(
    style: Record<string, string | number | boolean>
  ): RuleViolation | undefined {
    const size = style[FONT_SIZE];
    if (size && !Style.isFontSizeSufficent(`${size}`)) {
      return { message: messages.style.font };
    }
  }

  private checkLineHeight(
    style: Record<string, string | number | boolean>
  ): RuleViolation | undefined {
    const size = style[FONT_SIZE];
    const height = style[LINE_HEIGHT];
    if (size && height && !Style.isLineHeightSufficient(`${height}`, `${size}`)) {
      return { message: messages.style.height };
    }
  }

  private checkFontFamily(
    style: Record<string, string | number | boolean>
  ): RuleViolation | undefined {
    const family = style[FONT_FAMILY];
    if (family && Style.isFontProblematic(`${family}`)) {
      return {
        message: messages.style.family + family,
        severity: DiagnosticSeverity.Hint,
      };
    }
  }
}
