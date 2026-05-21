import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as jsx from '@babel/types';
import * as vscode from 'vscode';
import { buildDiagnostic } from '../utils/Diagnostic';
import { ParseError } from '../utils/ParseError';
import { PositionResolver, ZERO_RANGE } from '../utils/PositionResolver';
import {
  RuleValidator,
  RuleViolation,
  ValidationContext,
} from '../utils/RuleValidator';
import { ButtonValidator } from '../validators/ButtonValidator';
import { DivValidator } from '../validators/DivValidator';
import { HeadingValidator } from '../validators/HeadingValidator';
import { ImageValidator } from '../validators/ImageValidator';
import { StyleValidator } from '../validators/StyleValidator';
import { UniquenessValidator } from '../validators/UniquenessValidator';
import { TSXNodeAdapter } from './TSXNodeAdapter';

export interface TSXParsedDocument {
  ast: jsx.File;
}

class TSXPositionResolver implements PositionResolver {
  resolve({ node, loc: violationLoc }: RuleViolation): vscode.Range {
    const loc = (node as TSXNodeAdapter | undefined)?.loc ?? violationLoc;
    if (loc?.start && loc?.end) {
      return new vscode.Range(
        new vscode.Position(loc.start.line - 1, loc.start.column),
        new vscode.Position(loc.end.line - 1, loc.end.column),
      );
    }
    return ZERO_RANGE;
  }
}

const defaultTSXParser = (text: string): TSXParsedDocument => {
  try {
    const ast = parser.parse(text, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    return { ast };
  } catch (error) {
    throw new ParseError('Failed to parse TSX', { cause: error });
  }
};

export class TSXDiagnosticGenerator {
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
    private parser: (text: string) => TSXParsedDocument = defaultTSXParser,
  ) {}

  /**
   * Stage 1 — parse the input text into a typed document via the injected
   * parser. Throws {@link ParseError} when parsing fails.
   */
  public parse(text: string): TSXParsedDocument {
    return this.parser(text);
  }

  /**
   * Stage 2 — drive every RuleValidator across the parsed document and return
   * the collected violations. Pure function of `doc` + the validators array;
   * no parser involvement, no VS Code dependency.
   */
  public validate(doc: TSXParsedDocument): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const context: ValidationContext = { seenElements: [] };

    this.ruleValidators.forEach((v) => v.reset?.());

    traverse(doc.ast, {
      JSXElement: (path) => {
        const parentJSX = path.findParent((p) => p.isJSXElement())?.node as
          | jsx.JSXElement
          | undefined;
        const adapter = new TSXNodeAdapter(path.node, parentJSX);
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
        matching.forEach((validator) => {
          validator.validate(adapter, context).forEach((violation) => {
            violations.push(
              violation.node ? violation : { ...violation, node: adapter },
            );
          });
        });
        context.seenElements.push(name);
      },
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
   * TSX-specific PositionResolver. `_doc` is accepted for symmetry with the
   * HTML pipeline; TSX position math reads from the violation's attached node.
   */
  public diagnose(
    violations: RuleViolation[],
    _doc?: TSXParsedDocument,
  ): vscode.Diagnostic[] {
    const resolver = new TSXPositionResolver();
    return violations.map((v) => buildDiagnostic(v, resolver.resolve(v)));
  }

  /**
   * Public entry point — parse, validate, diagnose. Surfaces ParseError.
   */
  public generateDiagnostics(): vscode.Diagnostic[] {
    const doc = this.parse(this.text);
    const violations = this.validate(doc);
    return this.diagnose(violations, doc);
  }
}
