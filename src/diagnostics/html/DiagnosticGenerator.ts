import { Document } from 'domhandler';
import { DomUtils, parseDocument } from 'htmlparser2';
import * as vscode from 'vscode';
import { TAG } from '../utils/constants';
import { buildDiagnostic } from '../utils/Diagnostic';
import { ParseError } from '../utils/ParseError';
import { PositionResolver, ZERO_RANGE } from '../utils/PositionResolver';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';
import { AriaValidator } from '../validators/AriaValidator';
import { AttributesValidator } from '../validators/AttributesValidator';
import { ButtonValidator } from '../validators/ButtonValidator';
import { DivValidator } from '../validators/DivValidator';
import { FieldsetValidator } from '../validators/FieldsetValidator';
import { HeadingValidator } from '../validators/HeadingValidator';
import { ImageValidator } from '../validators/ImageValidator';
import { InputValidator } from '../validators/InputValidator';
import { LinkValidator } from '../validators/LinkValidator';
import { NavigationValidator } from '../validators/NavigationValidator';
import { RequiredValidator } from '../validators/RequiredValidator';
import { SectionValidator } from '../validators/SectionValidator';
import { StyleValidator } from '../validators/StyleValidator';
import { UniquenessValidator } from '../validators/UniquenessValidator';
import { HTMLNodeAdapter } from './HTMLNodeAdapter';
import NodeOrganizer from './NodeOrganizer';

export interface HTMLParsedDocument {
  tree: Document;
  organizer: NodeOrganizer;
}

class HTMLPositionResolver implements PositionResolver {
  constructor(private document: vscode.TextDocument) {}
  resolve({ node }: RuleViolation): vscode.Range {
    const adapter = node as HTMLNodeAdapter | undefined;
    const startIndex = adapter?.startIndex;
    const endIndex = adapter?.endIndex;
    if (startIndex !== undefined && endIndex !== undefined) {
      return new vscode.Range(
        this.document.positionAt(startIndex),
        this.document.positionAt(endIndex),
      );
    }
    return ZERO_RANGE;
  }
}

const defaultHTMLParser = (text: string): HTMLParsedDocument => {
  try {
    const tree = parseDocument(text, {
      withStartIndices: true,
      withEndIndices: true,
    });
    const tagNodes = DomUtils.filter(
      (node) => node.type === TAG,
      tree.children,
    );
    return { tree, organizer: new NodeOrganizer(tagNodes) };
  } catch (error) {
    throw new ParseError('Failed to parse HTML', { cause: error });
  }
};

export class HTMLDiagnosticGenerator {
  constructor(
    private htmlContent: string,
    private document: vscode.TextDocument,
    private ruleValidators: RuleValidator[] = [
      new ButtonValidator(),
      new AriaValidator(),
      new FieldsetValidator(),
      new StyleValidator(),
      new NavigationValidator(),
      new SectionValidator(),
      new ImageValidator(),
      new UniquenessValidator(),
      new RequiredValidator(),
      new AttributesValidator(),
      new DivValidator(),
      new InputValidator(),
      new LinkValidator(),
      new HeadingValidator(),
    ],
    private parser: (text: string) => HTMLParsedDocument = defaultHTMLParser,
  ) {}

  /**
   * Stage 1 — parse the input text into a typed document via the injected
   * parser. Throws {@link ParseError} when parsing fails.
   */
  public parse(text: string): HTMLParsedDocument {
    return this.parser(text);
  }

  /**
   * Stage 2 — drive every RuleValidator across the parsed document and return
   * the collected violations. Pure function of `doc` + the validators array;
   * no parser involvement, no VS Code dependency.
   */
  public validate(doc: HTMLParsedDocument): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const context: ValidationContext = { seenElements: [] };
    this.ruleValidators.forEach((v) => v.reset?.());

    this.ruleValidators.forEach((validator) => {
      doc.organizer.getNodes(validator.tags).forEach((el) => {
        const adapter = new HTMLNodeAdapter(el, this.htmlContent);
        validator.validate(adapter, context).forEach((violation) => {
          violations.push(
            violation.node ? violation : { ...violation, node: adapter },
          );
        });
      });
    });

    this.ruleValidators.forEach((validator) => {
      validator.finalize?.(context).forEach((violation) => {
        violations.push(violation);
      });
    });

    return violations;
  }

  /**
   * Stage 3 — map a prebuilt RuleViolation[] to vscode.Diagnostic[] using the
   * HTML-specific PositionResolver (character offsets via
   * TextDocument.positionAt).
   */
  public diagnose(
    violations: RuleViolation[],
    _doc?: HTMLParsedDocument,
  ): vscode.Diagnostic[] {
    const resolver = new HTMLPositionResolver(this.document);
    return violations.map((v) => buildDiagnostic(v, resolver.resolve(v)));
  }

  /**
   * Public entry point — parse, validate, diagnose. Surfaces ParseError.
   */
  generateDiagnostics() {
    const doc = this.parse(this.htmlContent);
    const violations = this.validate(doc);
    return this.diagnose(violations, doc);
  }
}
