import { Document } from 'domhandler';
import { DomUtils, parseDocument } from 'htmlparser2';
import * as vscode from 'vscode';
import { DiagnosticSeverity } from 'vscode';
import { TAG } from '../utils/constants';
import { RuleValidator, RuleViolation, ValidationContext } from '../utils/RuleValidator';
import { HTMLNodeAdapter } from './HTMLNodeAdapter';
import { Diagnostic } from './Diagnostic';
import NodeOrganizer from './NodeOrganizer';
import {
  AriaValidator,
  AttributesValidator,
  DivValidator,
  FieldsetValidator,
  HeadingValidator,
  ImageValidator,
  InputValidator,
  LinkValidator,
  NavigationValidator,
  RequiredValidator,
  SectionValidator,
  StyleValidator,
  UniquenessValidator,
  Validator,
} from './validators';
import { ButtonValidator } from '../validators/ButtonValidator';

export class HTMLDiagnosticGenerator {
  private diagnostics: vscode.Diagnostic[] = [];

  constructor(
    private htmlContent: string,
    private document: vscode.TextDocument,
    // Legacy validators using the old Validator interface — being migrated to RuleValidator in issues #05–#08.
    private validators: Validator[] = [
      new AttributesValidator(),
      new RequiredValidator(),
      new UniquenessValidator(),
      new NavigationValidator(),
      new HeadingValidator(),
      new LinkValidator(),
      new DivValidator(),
      new InputValidator(),
      new FieldsetValidator(),
      new ImageValidator(),
      new SectionValidator(),
      new AriaValidator(),
      new StyleValidator(),
    ],
    // Migrated validators using the new RuleValidator interface. Will replace validators[] in issue #09.
    private ruleValidators: RuleValidator[] = [new ButtonValidator()]
  ) {}

  /**
   * Generates and returns all diagnostics after running the validation process.
   */
  generateDiagnostics() {
    try {
      const parsedHtml = this.parseHtmlDocument();
      const nodeOrganizer = this.organizeNodes(parsedHtml);
      this.runValidators(nodeOrganizer);
      this.runRuleValidators(nodeOrganizer);
    } catch (error) {
      console.error('Error parsing HTML: ', error);
    }

    return this.diagnostics;
  }

  /** Legacy path — runs old-interface validators node-list-at-a-time. Removed in issue #09. */
  private runValidators(nodeOrganizer: NodeOrganizer) {
    this.validators.forEach((validator) => {
      const nodes = nodeOrganizer.getNodes(validator.nodeTags);

      validator.validate(nodes).forEach((error) => {
        const { diagnostic } = new Diagnostic(this.document, error);
        this.diagnostics.push(diagnostic);
      });
    });
  }

  /** New path — runs RuleValidator instances one node at a time via HTMLNodeAdapter. */
  private runRuleValidators(nodeOrganizer: NodeOrganizer) {
    const context: ValidationContext = { seenElements: [] };
    this.ruleValidators.forEach((validator) => {
      nodeOrganizer.getNodes(validator.tags).forEach((el) => {
        const adapter = new HTMLNodeAdapter(el);
        validator.validate(adapter, context).forEach((violation) => {
          this.diagnostics.push(this.ruleViolationToDiagnostic(adapter, violation));
        });
      });
    });
  }

  private ruleViolationToDiagnostic(
    adapter: HTMLNodeAdapter,
    { message, severity }: RuleViolation
  ): vscode.Diagnostic {
    const { startIndex, endIndex } = adapter;
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
