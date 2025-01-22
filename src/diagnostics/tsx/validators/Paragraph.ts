import { DiagnosticSeverity } from 'vscode';
import { ABBREVATIONS, PARAGRAPH } from '../../utils/constants';
import { messages } from '../../utils/messages';
import { Diagnostic } from '../Diagnostic';
import { TSXElement } from '../Element';
import { Validator, Visitor } from './Validator';

export class ParagraphValidator implements Validator {
  #tags: string[] = [PARAGRAPH];

  get tags() {
    return this.#tags;
  }

  validate(node: TSXElement): Diagnostic[] {
    return [this.checkAbbrevation(node)].filter(
      (error) => error instanceof Diagnostic
    );
  }

  checkAbbrevation(node: TSXElement): Diagnostic | undefined {
    const abbr = this.getAbbrevation(node);
    if (abbr) {
      return new Diagnostic(
        messages.p.abbr + abbr,
        node.loc,
        DiagnosticSeverity.Information
      );
    }
  }

  private getAbbrevation(node: TSXElement): string | undefined {
    return node.text.split(' ').find((word, _, self) => {
      const text = word.trim().toUpperCase();
      return (
        text in ABBREVATIONS &&
        !self.find(
          (word) =>
            word.trim().toUpperCase() ===
            ABBREVATIONS[text as keyof typeof ABBREVATIONS].trim().toUpperCase()
        )
      );
    });
  }

  accept<T>(visitor: Visitor<T>, node: TSXElement): T {
    return visitor.validate(node);
  }
}
