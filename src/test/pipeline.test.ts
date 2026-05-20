import * as assert from 'assert';
import * as vscode from 'vscode';
import { HTMLDiagnosticGenerator } from '../diagnostics/html/DiagnosticGenerator';
import { TSXDiagnosticGenerator } from '../diagnostics/tsx/DiagnosticGenerator';
import { ParseError } from '../diagnostics/utils/ParseError';
import { messages } from '../diagnostics/utils/messages';
import { ImageValidator } from '../diagnostics/validators/ImageValidator';
import { generateDocumentDiagnostics } from '../extension';

suite('Pipeline stages', () => {
  suite('parse()', () => {
    test('TSX parse() throws ParseError for syntactically invalid input', async () => {
      const document = await vscode.workspace.openTextDocument({
        content: '<div><span></div>', // unclosed/mismatched tags in TSX -> Babel parse error
        language: 'typescriptreact',
      });
      const generator = new TSXDiagnosticGenerator(document.getText());
      assert.throws(
        () => generator.parse(document.getText()),
        (err: unknown) => err instanceof ParseError,
        'expected ParseError to be thrown',
      );
    });

    test('HTML parse() succeeds even on lenient input (htmlparser2 is forgiving)', async () => {
      const document = await vscode.workspace.openTextDocument({
        content: '<div><span></div>',
        language: 'html',
      });
      const generator = new HTMLDiagnosticGenerator(
        document.getText(),
        document,
      );
      // htmlparser2 does not throw on malformed HTML; parse() must still complete.
      assert.doesNotThrow(() => generator.parse(document.getText()));
    });
  });

  suite('parser injection', () => {
    test('TSX generator uses the injected parser instead of @babel/parser', async () => {
      let called = false;
      const document = await vscode.workspace.openTextDocument({
        content: '<div />',
        language: 'typescriptreact',
      });
      const stubParser = (_text: string) => {
        called = true;
        // Hand back a fake parsed document with an empty AST so traverse is a no-op.
        return { ast: { type: 'File', program: { body: [] } } as never };
      };
      const generator = new TSXDiagnosticGenerator(
        document.getText(),
        [],
        stubParser,
      );
      generator.generateDiagnostics();
      assert.strictEqual(called, true, 'injected parser must be used');
    });

    test('HTML generator uses the injected parser instead of htmlparser2', async () => {
      let called = false;
      const document = await vscode.workspace.openTextDocument({
        content: '<div></div>',
        language: 'html',
      });
      const stubParser = (_text: string) => {
        called = true;
        return {
          tree: { children: [] } as never,
          organizer: { getNodes: () => [] } as never,
        };
      };
      const generator = new HTMLDiagnosticGenerator(
        document.getText(),
        document,
        [],
        stubParser,
      );
      generator.generateDiagnostics();
      assert.strictEqual(called, true, 'injected parser must be used');
    });
  });

  suite('extension ParseError handling', () => {
    test('malformed TSX surfaces as a single (0,0) diagnostic with the ParseError message', async () => {
      const document = await vscode.workspace.openTextDocument({
        content: '<div><span></div>',
        language: 'typescriptreact',
      });

      const diagnostics = generateDocumentDiagnostics(document);

      assert.strictEqual(diagnostics.length, 1);
      const [d] = diagnostics;
      assert.ok(
        d.message.includes('parse') || d.message.includes('Parse'),
        `expected parse-error message, got: ${d.message}`,
      );
      assert.strictEqual(d.range.start.line, 0);
      assert.strictEqual(d.range.start.character, 0);
      assert.strictEqual(d.range.end.line, 0);
      assert.strictEqual(d.range.end.character, 0);
    });
  });

  suite('diagnose()', () => {
    test('TSX diagnose() maps a prebuilt RuleViolation[] to vscode.Diagnostic[] without validator involvement', async () => {
      const document = await vscode.workspace.openTextDocument({
        content: '<div>hi</div>',
        language: 'typescriptreact',
      });
      const generator = new TSXDiagnosticGenerator(document.getText(), []);
      const doc = generator.parse(document.getText());

      const violations = [{ message: 'stub violation' }];
      const diagnostics = generator.diagnose(violations, doc);

      assert.strictEqual(diagnostics.length, 1);
      assert.strictEqual(diagnostics[0].message, 'stub violation');
    });

    test('HTML diagnose() maps a prebuilt RuleViolation[] to vscode.Diagnostic[] without validator involvement', async () => {
      const document = await vscode.workspace.openTextDocument({
        content: '<div>hi</div>',
        language: 'html',
      });
      const generator = new HTMLDiagnosticGenerator(
        document.getText(),
        document,
        [],
      );
      const doc = generator.parse(document.getText());

      const violations = [{ message: 'stub violation' }];
      const diagnostics = generator.diagnose(violations, doc);

      assert.strictEqual(diagnostics.length, 1);
      assert.strictEqual(diagnostics[0].message, 'stub violation');
    });
  });

  suite('validate()', () => {
    test('TSX validate() consumes a prebuilt ParsedDocument and returns violations without parser involvement', async () => {
      const document = await vscode.workspace.openTextDocument({
        content: '<img />',
        language: 'typescriptreact',
      });
      const generator = new TSXDiagnosticGenerator(document.getText(), [
        new ImageValidator(),
      ]);
      const doc = generator.parse(document.getText());

      const violations = generator.validate(doc);

      assert.strictEqual(violations.length, 1);
      assert.strictEqual(violations[0].message, messages.img.alt);
    });

    test('HTML validate() consumes a prebuilt ParsedDocument and returns violations without parser involvement', async () => {
      const document = await vscode.workspace.openTextDocument({
        content: '<img>',
        language: 'html',
      });
      const generator = new HTMLDiagnosticGenerator(
        document.getText(),
        document,
        [new ImageValidator()],
      );
      const doc = generator.parse(document.getText());

      const violations = generator.validate(doc);

      assert.strictEqual(violations.length, 1);
      assert.strictEqual(violations[0].message, messages.img.alt);
    });
  });
});
