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
import { StyleValidator } from '../validators/StyleValidator';
import { UniquenessValidator } from '../validators/UniquenessValidator';
import { TSXNodeAdapter } from './TSXNodeAdapter';
import { DivValidator } from './validators/Div';
import { ImageValidator } from './validators/Image';
import { LinkValidator } from './validators/Link';

export class TSXDiagnosticGenerator {
  private diagnostics: vscode.Diagnostic[] = [];

  constructor(
    private text: string,
    private ruleValidators: RuleValidator[] = [
      new ButtonValidator(),
      new ImageValidator(),
      new LinkValidator(),
      new DivValidator(),
      new HeadingValidator(),
      new UniquenessValidator(),
      new StyleValidator(),
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
    const adapter = new TSXNodeAdapter(node);
    const name = adapter.name;

    if (!name) {
      return;
    }

    const matching = this.ruleValidators.filter(({ tags }) =>
      tags.includes(name),
    );
    if (matching.length === 0) {
      return;
    }

    matching.forEach((ruleValidator) => {
      ruleValidator.validate(adapter, context).forEach((violation) => {
        this.diagnostics.push(
          this.ruleViolationToDiagnostic(violation, adapter),
        );
      });
    });

    context.seenElements.push(name);
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
