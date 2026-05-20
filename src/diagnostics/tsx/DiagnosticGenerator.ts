import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as jsx from '@babel/types';
import * as vscode from 'vscode';
import { DiagnosticSeverity } from 'vscode';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';
import { ButtonValidator } from '../validators/ButtonValidator';
import { HeadingValidator } from '../validators/HeadingValidator';
import { UniquenessValidator } from '../validators/UniquenessValidator';
import { TSXElement } from './Element';
import { TSXNodeAdapter } from './TSXNodeAdapter';
import { StyleValidator } from './validators';
import { DivValidator } from './validators/Div';
import { ImageValidator } from './validators/Image';
import { LinkValidator } from './validators/Link';
import { Validator } from './validators/Validator';

export class TSXDiagnosticGenerator {
  private diagnostics: vscode.Diagnostic[] = [];

  constructor(
    private text: string,
    private styleValidator = new StyleValidator(),
    // Legacy validators using the old Validator interface — being migrated to RuleValidator in issues #05–#08.
    private validators: Validator[] = [],
    // Migrated validators using the new RuleValidator interface. Will replace validators[] in issue #09.
    private ruleValidators: RuleValidator[] = [
      new ButtonValidator(),
      new ImageValidator(),
      new LinkValidator(),
      new DivValidator(),
      new HeadingValidator(),
      new UniquenessValidator(),
    ],
  ) {}

  /**
   * Generates diagnostics for the TSX code.
   */
  public generateDiagnostics(): vscode.Diagnostic[] {
    try {
      const ast = this.parseText();
      const seenElements: string[] = [];
      const context: ValidationContext = { seenElements };

      this.ruleValidators.forEach((v) => v.reset?.());

      traverse(ast, {
        JSXElement: (path) => this.checkElement(path.node, context),
      });

      this.ruleValidators.forEach((validator) => {
        validator.finalize?.(context).forEach((violation) => {
          this.diagnostics.push(this.ruleViolationToDiagnostic(violation));
        });
      });
    } catch (error) {
      console.error('Error parsing code: ', error);
    }

    return this.diagnostics;
  }

  /**
   * Checks a JSX element and adds diagnostics if issues are found.
   */
  private checkElement(node: jsx.JSXElement, context: ValidationContext): void {
    const element = new TSXElement(node);

    if (!element.name) {
      return;
    }

    // Legacy path: old-interface validator handles this element.
    const validator = this.findValidator(element.name);
    if (validator) {
      this.diagnostics.push(...this.collectDiagnostics(element, validator));
    }

    // New path: RuleValidator(s) handle this element. More than one validator
    // may claim the same tag (e.g. h1 → HeadingValidator + UniquenessValidator).
    const ruleValidators = this.ruleValidators.filter(({ tags }) =>
      tags.includes(element.name!),
    );
    if (ruleValidators.length > 0) {
      // Style checks not yet migrated to RuleValidator — bridge via direct call until issue #08/#09.
      // img is exempt to match the legacy validateImage() no-op behavior from the Visitor pattern.
      if (element.name !== 'img') {
        this.styleValidator.validate(element).forEach(({ diagnostic }) => {
          this.diagnostics.push(diagnostic);
        });
      }
      const adapter = new TSXNodeAdapter(node);
      ruleValidators.forEach((ruleValidator) => {
        ruleValidator.validate(adapter, context).forEach((violation) => {
          this.diagnostics.push(
            this.ruleViolationToDiagnostic(violation, adapter),
          );
        });
      });
    }

    if (validator || ruleValidators.length > 0) {
      context.seenElements.push(element.name);
    }
  }

  private collectDiagnostics(
    element: TSXElement,
    validator: Validator,
  ): vscode.Diagnostic[] {
    return validator
      .accept(this.styleValidator, element)
      .map(({ diagnostic }) => diagnostic);
  }

  private findValidator(name: string): Validator | undefined {
    return this.validators.find(({ tags }) => tags.includes(name));
  }

  private ruleViolationToDiagnostic(
    { message, severity, node, loc: violationLoc }: RuleViolation,
    adapter?: TSXNodeAdapter,
  ): vscode.Diagnostic {
    const loc =
      adapter?.loc ?? (node as TSXNodeAdapter | undefined)?.loc ?? violationLoc;
    const range =
      loc?.start && loc?.end
        ? new vscode.Range(
            new vscode.Position(loc.start.line - 1, loc.start.column),
            new vscode.Position(loc.end.line - 1, loc.end.column),
          )
        : new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(0, 0),
          );
    return new vscode.Diagnostic(
      range,
      message,
      severity ?? DiagnosticSeverity.Warning,
    );
  }

  /**
   * Parse the provided code as an entire program.
   */
  private parseText() {
    return parser.parse(this.text, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
  }
}
