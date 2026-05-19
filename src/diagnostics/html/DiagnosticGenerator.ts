import { Document } from 'domhandler';
import { DomUtils, parseDocument } from 'htmlparser2';
import * as vscode from 'vscode';
import { DiagnosticSeverity } from 'vscode';
import { TAG } from '../utils/constants';
import { RuleValidator, RuleViolation, ValidationContext } from '../utils/RuleValidator';
import { HTMLNodeAdapter } from './HTMLNodeAdapter';
import NodeOrganizer from './NodeOrganizer';
import { ButtonValidator } from '../validators/ButtonValidator';
import { AriaValidator } from '../validators/AriaValidator';
import { FieldsetValidator } from '../validators/FieldsetValidator';
import { StyleValidator } from '../validators/StyleValidator';
import { NavigationValidator } from '../validators/NavigationValidator';
import { SectionValidator } from '../validators/SectionValidator';
import { ImageValidator } from '../validators/ImageValidator';
import { UniquenessValidator } from '../validators/UniquenessValidator';
import { RequiredValidator } from '../validators/RequiredValidator';
import { AttributesValidator } from '../validators/AttributesValidator';
import { DivValidator } from '../validators/DivValidator';
import { InputValidator } from '../validators/InputValidator';
import { LinkValidator } from '../validators/LinkValidator';
import { HeadingValidator } from '../validators/HeadingValidator';

export class HTMLDiagnosticGenerator {
  private diagnostics: vscode.Diagnostic[] = [];

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
    ]
  ) {}

  /**
   * Generates and returns all diagnostics after running the validation process.
   */
  generateDiagnostics() {
    try {
      const parsedHtml = this.parseHtmlDocument();
      const nodeOrganizer = this.organizeNodes(parsedHtml);
      this.runRuleValidators(nodeOrganizer);
    } catch (error) {
      console.error('Error parsing HTML: ', error);
    }

    return this.diagnostics;
  }

  private runRuleValidators(nodeOrganizer: NodeOrganizer) {
    const context: ValidationContext = { seenElements: [] };
    this.ruleValidators.forEach((v) => v.reset?.());

    this.ruleValidators.forEach((validator) => {
      nodeOrganizer.getNodes(validator.tags).forEach((el) => {
        const adapter = new HTMLNodeAdapter(el);
        validator.validate(adapter, context).forEach((violation) => {
          this.diagnostics.push(this.ruleViolationToDiagnostic(violation, adapter));
        });
      });
    });

    this.ruleValidators.forEach((validator) => {
      validator.finalize?.(context).forEach((violation) => {
        this.diagnostics.push(this.ruleViolationToDiagnostic(violation));
      });
    });
  }

  private ruleViolationToDiagnostic(
    { message, severity, node }: RuleViolation,
    adapter?: HTMLNodeAdapter
  ): vscode.Diagnostic {
    const target = adapter ?? (node as HTMLNodeAdapter | undefined);
    const startIndex = target?.startIndex;
    const endIndex = target?.endIndex;
    const range =
      startIndex !== undefined && endIndex !== undefined
        ? new vscode.Range(
            this.document.positionAt(startIndex),
            this.document.positionAt(endIndex)
          )
        : new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
    return new vscode.Diagnostic(range, message, severity ?? DiagnosticSeverity.Warning);
  }

  /**
   * Parses the HTML content into a document object.
   */
  private parseHtmlDocument() {
    return parseDocument(this.htmlContent, {
      withStartIndices: true,
      withEndIndices: true,
    });
  }

  /**
   * Organizes the nodes into a structure accessible by tag name.
   */
  private organizeNodes(parsedHtml: Document) {
    return new NodeOrganizer(this.getNodes(parsedHtml));
  }

  /**
   * Search a node and its children for nodes with the type "tag".
   */
  private getNodes(parsedHtml: Document) {
    return DomUtils.filter((node) => node.type === TAG, parsedHtml.children);
  }
}
