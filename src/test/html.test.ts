import * as assert from 'assert';
import * as vscode from 'vscode';
import { meta, html, head, body, title } from './helper';
import { Diagnostic as HTMLDiagnostic } from '../diagnostics/html/Diagnostic';
import { defaultMessages, warnings } from '../diagnostics/html/Warnings';

/**
 * Creates an html document based on a string.
 */
const getDocument = (html: string) =>
  vscode.workspace.openTextDocument({
    content: html,
    language: 'html',
  });

/**
 * Generates diagnostics for an html document.
 */
const generateDiagnostics = (document: vscode.TextDocument) =>
  new HTMLDiagnostic(document.getText(), document).generateDiagnostics();

suite('HTML Test Suite', () => {
  test('Missing lang attribute in <html> tag', async () => {
    const html = `<html></html>`;

    const document = await getDocument(html);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(
      diagnostics[0].message,
      warnings.html.hasMissingAttribute
    );
  });

  test('Empty HTML should return two diagnostics', async () => {
    const html = '';

    const document = await getDocument(html);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 2);
  });

  test('Empty lang attribute in <html> tag', async () => {
    const html = `<html lang=""></html>`;

    const document = await getDocument(html);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(
      diagnostics[0].message,
      warnings.html.hasMissingAttribute
    );
  });

  test('Missing <title> tag', async () => {
    const content = html(head(meta) + body());

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, warnings.title.shouldExist);
  });

  test('Missing viewport attribute on <meta> element', async () => {
    const content = html(head(title) + body());

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, warnings.meta.shouldExist);
  });

  test('Two occurrences of <title> tag', async () => {
    const content = html(head(meta + title + title) + body());

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(
      diagnostics[0].message,
      defaultMessages.shouldBeUnique + 'title'
    );
  });

  test('Two occurrences of <main> tag', async () => {
    const content = html(
      head(meta + title) + body('<main></main><main></main>')
    );

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, warnings.main.shouldBeUnique);
  });

  test('Two occurrences of <nav> without attributes', async () => {
    const content = html(head(meta + title) + body('<nav></nav><nav></nav>'));

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(
      diagnostics[0].message,
      warnings.nav.hasMissingAttribute
    );
  });

  test('Two occurrences of <nav> with attributes', async () => {
    const content = html(
      head(meta + title) +
        body('<nav aria-label="main"></nav><nav aria-label="content"></nav>')
    );

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('Two occurrences of <h1> tag', async () => {
    const content = html(head(meta + title) + body('<h1></h1><h1></h1>'));

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, warnings.h1.shouldBeUnique);
  });

  test('Heading <h4> tag with missing <h3>', async () => {
    const content = html(head(meta + title) + body('<h4></h4>'));

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(
      diagnostics[0].message,
      warnings.h4.hasMissingDependency
    );
  });

  test('Heading <h4> and <h3> tag with missing <h2>', async () => {
    const content = html(head(meta + title) + body('<h3> h3</h3><h4></h4>'));

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(
      diagnostics[0].message,
      warnings.h4.hasMissingDependency
    );
  });

  test('Heading <h2> tag with exisiting <h1> tag', async () => {
    const content = html(head(meta + title) + body('<h1></h1><h2></h2>'));

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('Valid HTML should return no diagnostics', async () => {
    const content = html(head(meta + title) + body());

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });
});
