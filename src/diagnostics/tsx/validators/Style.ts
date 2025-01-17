import { isRatioOk } from 'hue-check';
import { messages } from '../../utils/messages';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Visitor } from './Validator';

export class StyleValidator implements Visitor<Diagnostic[]> {
  validate(node: TSXElement): Diagnostic[] {
    return [this.checkColorContrast(node)].filter(
      (error) => error instanceof Diagnostic
    );
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
}
