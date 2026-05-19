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
  DivValidator,
  HeadingValidator,
  InputValidator,
  LinkValidator,
  Validator,
} from './validators';
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

export class HTMLDiagnosticGenerator {
  private diagnostics: vscode.Diagnostic[] = [];

  constructor(
    private htmlContent: string,
    private document: vscode.TextDocument,
    // Legacy validators using the old Validator interface — being migrated to RuleValidator in issues #05–#08.
    private validators: Validator[] = [
      new HeadingValidator(),
      new LinkValidator(),
      new DivValidator(),
      new InputValidator(),
    ],
    // Migrated validators using the new RuleValidator interface. Will replace validators[] in issue #09.
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
    ]
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
