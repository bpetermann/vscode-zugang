import * as assert from 'assert';
import * as vscode from 'vscode';
import { TSXDiagnosticGenerator } from '../../diagnostics/tsx/DiagnosticGenerator';
import { messages } from '../../diagnostics/utils/messages';
import { div, fraction } from '../helper';

/**
 * Generates diagnostics for an tsx document.
 */
const generateDiagnostics = (document: vscode.TextDocument) =>
  new TSXDiagnosticGenerator(document.getText()).generateDiagnostics();

export const getDocument = (tsx: string) =>
  vscode.workspace.openTextDocument({
    content: tsx,
    language: 'typescriptreact',
  });

suite('TSX Test Suite', () => {
  test('should handle it gracefully if no validator is found', async () => {
    const tsx = `<br></br>`;

    const document = await getDocument(tsx);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('should handle it gracefully if handed unknown element', async () => {
    const tsx = `<MyButton></MyButton>`;

    const document = await getDocument(tsx);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('<img> with missing alt attribute', async () => {
    const tsx = `<img src="/me.jpg"></img>`;

    const document = await getDocument(tsx);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, messages.img.alt);
  });

  test('<img> tag with an empty alt attribute', async () => {
    const tsx = `<img src="/me.jpg" alt=""></img>`;

    const document = await getDocument(tsx);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('<img> tag with an generic alt text', async () => {
    const alt = 'A .jpg';
    const tsx = `<img src="/me.jpg" alt="A .jpg"></img>`;

    const document = await getDocument(tsx);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, messages.img.generic + alt);
  });

  test('<button> with role="switch" but missing aria-checked', async () => {
    const content = `<button role="switch"></button>`;

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, messages.button.switch);
  });

  test('<button> with no text content', async () => {
    const content = `<button></button>`;

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, messages.button.text);
  });

  test('<button> with text content', async () => {
    const content = `<button>open cart</button>`;

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('<button> with no text but <img> as child', async () => {
    const img = '<img src="/me.jpg" alt="Sunrise"></img>';
    const content = `<button>${img}</button>`;

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('<button> with no text but "aria-label"', async () => {
    const content = `<button aria-label="product count"></button>`;

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('<button> with no text but "aria-labelledby"', async () => {
    const content = `<button aria-labelledby="submit-heading"></button>`;

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('<button> with no text but "title"', async () => {
    const content = `<button title="Submit Form"></button>`;

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('<button> with abstract role "command"', async () => {
    const abstract = 'command';
    const content = `<button role="${abstract}">command</button>`;

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)[0];

    assert.strictEqual(message, messages.button.abstract + abstract);
  });

  test('<button> with abstract role "widget"', async () => {
    const abstract = 'widget';
    const content = `<button role="${abstract}">widget</button>`;

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)[0];

    assert.strictEqual(message, messages.button.abstract + abstract);
  });

  test('<div> with abstract role "command"', async () => {
    const abstract = 'command';
    const content = div(null, `role="${abstract}"`);

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)[0];

    assert.strictEqual(message, messages.div.abstract + abstract);
  });

  test('<div> with abstract role "widget"', async () => {
    const abstract = 'widget';
    const content = div(null, `role="${abstract}"`);

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)[0];

    assert.strictEqual(message, messages.div.abstract + abstract);
  });

  test('Long sequence of nested <div> elements', async () => {
    const content = div(div(div(div(div(div(null))))));

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, messages.div.soup);
  });

  test('A single <div> element', async () => {
    const content = div(null);

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('<div> tag with "onclick" event', async () => {
    const content = div(null, 'onclick="click()"');

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.div.button);
  });

  test('<div> tag with role="button"', async () => {
    const content = div(null, 'role="button"');

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.div.button);
  });

  test('<div> used as a button', async () => {
    const content = fraction(
      div(null, 'role="button"'),
      div(null, 'onclick="click()"')
    );

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 2);
  });

  test('<div> tag with aria-expanded attribute', async () => {
    const content = div(null, 'aria-expanded="true"');

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.div.expanded);
  });

  test('<div> with aria hidden and focusable children', async () => {
    const content = div('<a href="/blog"></a>', 'aria-hidden="true"');

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.div['aria-hidden']);
  });

  test('<div> with aria hidden and <button> child', async () => {
    const button = '<button>click me</button>';
    const content = div(div(div(div(button))), 'aria-hidden="true"');

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.div['aria-hidden']);
  });

  test('<div> with aria hidden and <a> child', async () => {
    const link = '<a href="/contact">contact</a>';
    const content = div(
      div(div(fraction(div(null), link))),
      'aria-hidden="true"'
    );

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.div['aria-hidden']);
  });

  test('<a> tag with a generic description', async () => {
    const text = 'click';
    const content = `<a>${text}</a>`;

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics[0].message, messages.link.generic + text);
  });

  test('<a> tag with a no description', async () => {
    const content = `<a></a>`;

    const document = await getDocument(content);
    const diagnostics = generateDiagnostics(document);

    assert.strictEqual(diagnostics.length, 0);
  });

  test('<a> tag with a an "onclick" event', async () => {
    const content = `<a onclick="click()"></a>`;

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.link.onclick);
  });

  test('<a> tag with "mailto" in the "href"', async () => {
    const linktext = 'If you want to learn more about our products, contact us';
    const content = `<a href="mailto:support@office.com">${linktext}</a>`;

    const document = await getDocument(content);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.link.mail);
  });

  test('<button> without sufficient color/background ratio', async () => {
    const button =
      '<button style={{ color: "black", backgroundColor: "black"}}>click me</button>';

    const document = await getDocument(button);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.style.color);
  });

  test('<div> without sufficient color/background ratio', async () => {
    const div =
      '<div style={{ color: "black", backgroundColor: "black"}}>click me</div>';

    const document = await getDocument(div);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.style.color);
  });

  test('<a> without sufficient color/background ratio', async () => {
    const a =
      '<a style={{ color: "black", backgroundColor: "black"}}>click me</a>';

    const document = await getDocument(a);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.style.color);
  });

  test('<button> with sufficient color/background ratio', async () => {
    const button =
      '<button style={{ color: "white", backgroundColor: "black"}}>click me</button>';

    const document = await getDocument(button);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 0);
  });
});
