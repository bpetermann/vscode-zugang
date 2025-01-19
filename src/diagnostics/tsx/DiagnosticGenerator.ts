import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as jsx from '@babel/types';
import * as vscode from 'vscode';
import { Diagnostic } from './Diagnostic';
import { TSXElement } from './Element';
import {
  ButtonValidator,
  DivValidator,
  ImageValidator,
  LinkValidator,
  StyleValidator,
} from './validators';
import { Validator } from './validators/Validator';

export class TSXDiagnosticGenerator {
  private diagnostics: vscode.Diagnostic[] = [];

  constructor(
    private text: string,
    private styleValidator = new StyleValidator(),
    private validators: Validator[] = [
      new ButtonValidator(),
      new ImageValidator(),
      new DivValidator(),
      new LinkValidator(),
    ]
  ) {}

  /**
   * Generates diagnostics for the TSX code.
   */
  public generateDiagnostics(): vscode.Diagnostic[] {
    try {
      const ast = this.parseText();

      traverse(ast, {
        JSXElement: (path) => this.checkElement(path.node),
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

    const validator = this.findValidator(element.name);

    if (!validator) {
      return;
    }

    this.diagnostics.push(
      ...this.collectDiagnostics(element, validator).map(
        ({ diagnostic }) => diagnostic
      )
    );
  }

  private collectDiagnostics(
    element: TSXElement,
    validator: Validator
  ): Diagnostic[] {
    return [
      ...validator.accept(this.styleValidator, element),
      ...validator.validate(element),
    ];
  }

  private findValidator(name: string): Validator | undefined {
    return this.validators.find(({ tags }) => tags.includes(name));
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
