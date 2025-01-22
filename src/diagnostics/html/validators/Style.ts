import { Element } from 'domhandler';
import { isRatioOk } from 'hue-check';
import { DiagnosticSeverity } from 'vscode';
import {
  BG_COLOR,
  FONT_FAMILY,
  FONT_SIZE,
  LINE_HEIGHT,
  STYLE_TAGS,
} from '../../utils/constants';
import { messages } from '../../utils/messages';
import { Style } from '../../utils/Style';
import { HTMLElement } from '../Element';
import { Validator, ValidatorError } from './Validator';

export class StyleValidator implements Validator {
  readonly #nodeTags = STYLE_TAGS;

  get nodeTags() {
    return this.#nodeTags;
  }

  validate(nodes: Element[]): ValidatorError[] {
    const errors: (ValidatorError | undefined)[] = [];

    nodes.forEach((element) => {
      const style = HTMLElement.getStyles(element);

      if (Object.keys(style).length) {
        errors.push(this.checkContrast(style, element));
        errors.push(this.checkFontSize(style, element));
        errors.push(this.checkLineHeight(style, element));
        errors.push(this.checkFontFamily(style, element));
      }
    });

    return errors.filter((error) => error instanceof ValidatorError);
  }

  private checkContrast(
    style: {
      [k: string]: string;
    },
    element: Element
  ): ValidatorError | undefined {
    if (
      style[BG_COLOR] &&
      style.color &&
      !isRatioOk(style[BG_COLOR], style.color)
    ) {
      return new ValidatorError(messages.style.color, element);
    }
  }

  private checkFontSize(
    style: {
      [k: string]: string;
    },
    element: Element
  ): ValidatorError | undefined {
    if (style[FONT_SIZE] && !Style.isFontSizeSufficent(style[FONT_SIZE])) {
      return new ValidatorError(messages.style.font, element);
    }
  }

  private checkLineHeight(
    style: {
      [k: string]: string;
    },
    element: Element
  ): ValidatorError | undefined {
    if (
      style[FONT_SIZE] &&
      style[LINE_HEIGHT] &&
      !Style.isLineHeightSufficient(style[LINE_HEIGHT], style[FONT_SIZE])
    ) {
      return new ValidatorError(messages.style.height, element);
    }
  }

  private checkFontFamily(
    style: {
      [k: string]: string;
    },
    element: Element
  ): ValidatorError | undefined {
    if (style[FONT_FAMILY] && Style.isFontProblematic(style[FONT_FAMILY])) {
      return new ValidatorError(
        messages.style.family + style[FONT_FAMILY],
        element,
        DiagnosticSeverity.Hint
      );
    }
  }
}
