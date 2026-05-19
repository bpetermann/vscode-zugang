import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as jsx from '@babel/types';
import * as vscode from 'vscode';
import { DiagnosticSeverity } from 'vscode';
import { RuleValidator, RuleViolation, ValidationContext } from '../utils/RuleValidator';
import { TSXNodeAdapter } from './TSXNodeAdapter';
import { TSXElement } from './Element';
import {
  DivValidator,
  HeadingValidator,
  ImageValidator,
  LinkValidator,
  StyleValidator,
} from './validators';
import { Validator } from './validators/Validator';
import { ButtonValidator } from '../validators/ButtonValidator';

export class TSXDiagnosticGenerator {
  private diagnostics: vscode.Diagnostic[] = [];

  constructor(
    private text: string,
    private styleValidator = new StyleValidator(),
    private elements: string[] = [],
    // Legacy validators using the old Validator interface — being migrated to RuleValidator in issues #05–#08.
    private validators: Validator[] = [
      new ImageValidator(),
      new DivValidator(),
      new LinkValidator(),
      new HeadingValidator(),
    ],
    // Migrated validators using the new RuleValidator interface. Will replace validators[] in issue #09.
    private ruleValidators: RuleValidator[] = [new ButtonValidator()]
  ) {}

  /**
   * Generates diagnostics for the TSX code.
   */
  public generateDiagnostics(): vscode.Diagnostic[] {
    try {
      const ast = this.parseText();

      this.ruleValidators.forEach((v) => v.reset?.());

      traverse(ast, {
        JSXElement: (path) => this.checkElement(path.node),
      });

      const context: ValidationContext = { seenElements: this.elements };
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
  private checkElement(node: jsx.JSXElement): void {
    const element = new TSXElement(node);

    if (!element.name) {
      return;
    }

    // Legacy path: old-interface validator handles this element.
    const validator = this.findValidator(element.name);
    if (validator) {
      this.diagnostics.push(...this.collectDiagnostics(element, validator));
    }

    // New path: RuleValidator handles this element.
    // NOTE: a tag must live in exactly one of validators[] / ruleValidators[] during the migration —
    // double-registering would run styleValidator.validate(element) twice (once via legacy accept,
    // once via the bridge below). Migrations #05/#06 must remove from validators[] when moving to ruleValidators[].
    const ruleValidator = this.ruleValidators.find(({ tags }) =>
      tags.includes(element.name!)
    );
    if (ruleValidator) {
      // Style checks are not yet migrated to RuleValidator — bridge via direct call until issue #09.
      this.styleValidator.validate(element).forEach(({ diagnostic }) => {
        this.diagnostics.push(diagnostic);
      });
      const adapter = new TSXNodeAdapter(node);
      const context: ValidationContext = { seenElements: this.elements };
      ruleValidator.validate(adapter, context).forEach((violation) => {
        this.diagnostics.push(this.ruleViolationToDiagnostic(violation, adapter));
      });
    }

    if (validator || ruleValidator) {
      this.elements.push(element.name);
    }
  }

  private collectDiagnostics(
    element: TSXElement,
    validator: Validator
  ): vscode.Diagnostic[] {
    return [
      ...validator.accept(this.styleValidator, element),
      ...(validator instanceof HeadingValidator
        ? validator.validate(element, this.elements)
        : validator.validate(element)),
    ].map(({ diagnostic }) => diagnostic);
  }

  private findValidator(name: string): Validator | undefined {
    return this.validators.find(({ tags }) => tags.includes(name));
  }

  private ruleViolationToDiagnostic(
    { message, severity, node, loc: violationLoc }: RuleViolation,
    adapter?: TSXNodeAdapter
  ): vscode.Diagnostic {
    const loc =
      adapter?.loc ??
      (node as TSXNodeAdapter | undefined)?.loc ??
      violationLoc;
    const range =
      loc?.start && loc?.end
        ? new vscode.Range(
            new vscode.Position(loc.start.line - 1, loc.start.column),
            new vscode.Position(loc.end.line - 1, loc.end.column)
          )
        : new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
    return new vscode.Diagnostic(range, message, severity ?? DiagnosticSeverity.Warning);
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
