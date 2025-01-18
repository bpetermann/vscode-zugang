import * as assert from 'assert';
import { messages } from '../../diagnostics/utils/messages';
import { generateDiagnostics, getTSXDocument as getDocument } from '../helper';

suite('TSX Style Validator Test Suite', () => {
  test('Handle <div> without a style attribute gracefully', async () => {
    const div = '<div>text</div>';

    const document = await getDocument(div);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 0);
  });

  test('Handle <div> with invalid style value gracefully', async () => {
    const div = '<div style="invalid-style">text</div>';

    const document = await getDocument(div);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 0);
  });

  /* Color*/
  test('Detect insufficient color contrast', async () => {
    const elements = ['<div>', '<button>', '<a>'];

    elements.forEach((tag) => {
      test(`${tag} with insufficient color contrast`, async () => {
        const element = `${tag} style={{ color: "black", backgroundColor: "black"}}>text</${tag.slice(
          1
        )}`;

        const document = await getDocument(element);
        const { message } = generateDiagnostics(document)?.[0];

        assert.strictEqual(message, messages.style.color);
      });
    });
  });

  test('<div> with multiple accessibility issues', async () => {
    const div =
      '<div style={{ color: "black", backgroundColor: "black", fontSize: 4 }}>text</div>';

    const document = await getDocument(div);
    const errorMessages = generateDiagnostics(document).map(
      ({ message }) => message
    );

    assert.ok(errorMessages.includes(messages.style.color));
    assert.ok(errorMessages.includes(messages.style.font));
  });

  test('Pass validation for elements with sufficient color contrast', async () => {
    const elements = ['<div>', '<button>', '<a>'];

    elements.forEach((tag) => {
      test(`${tag} with insufficient color contrast`, async () => {
        const element = `${tag} style={{ color: "black", backgroundColor: "white"}}>text</${tag.slice(
          1
        )}`;

        const document = await getDocument(element);
        const errors = generateDiagnostics(document);

        assert.strictEqual(errors.length, 0);
      });
    });
  });

  /* Font Size*/
  test('Detect insufficient font size in elements', async () => {
    const elements = ['<div>', '<button>', '<a>'];

    elements.forEach((tag) => {
      test(`${tag} with insufficient color contrast`, async () => {
        const element = `${tag} style={{ fontSize: 4}}>text</${tag.slice(1)}`;

        const document = await getDocument(element);
        const { message } = generateDiagnostics(document)?.[0];

        assert.strictEqual(message, messages.style.font);
      });
    });
  });

  /* Line Height*/
  test('Detect insufficient line height (unitless) in elements', async () => {
    const elements = ['<div>', '<button>', '<a>'];

    elements.forEach((tag) => {
      test(`${tag} with insufficient color contrast`, async () => {
        const element = `${tag} style={{ fontSize: 18, lineHeight: 1}}>text</${tag.slice(
          1
        )}`;

        const document = await getDocument(element);
        const { message } = generateDiagnostics(document)?.[0];

        assert.strictEqual(message, messages.style.height);
      });
    });
  });

  test('Detect insufficient line height (px) in elements', async () => {
    const elements = ['<div>', '<button>', '<a>'];

    elements.forEach((tag) => {
      test(`${tag} with insufficient color contrast`, async () => {
        const element = `${tag} style={{ fontSize: "18px", lineHeight: "16px"}}>text</${tag.slice(
          1
        )}`;

        const document = await getDocument(element);
        const { message } = generateDiagnostics(document)?.[0];

        assert.strictEqual(message, messages.style.height);
      });
    });
  });

  test('Detect insufficient line height (rem) in elements', async () => {
    const elements = ['<div>', '<button>', '<a>'];

    elements.forEach((tag) => {
      test(`${tag} with insufficient color contrast`, async () => {
        const element = `${tag} style={{ fontSize: "1.125rem", lineHeight: "1rem"}}>text</${tag.slice(
          1
        )}`;

        const document = await getDocument(element);
        const { message } = generateDiagnostics(document)?.[0];

        assert.strictEqual(message, messages.style.height);
      });
    });
  });

  test('Elements with sufficient lineHeight in px', async () => {
    const elements = ['<div>', '<button>', '<a>'];

    elements.forEach((tag) => {
      test(`${tag} with insufficient color contrast`, async () => {
        const element = `${tag} style={{ fontSize: "16px", lineHeight: "24px"}}>text</${tag.slice(
          1
        )}`;

        const document = await getDocument(element);
        const { message } = generateDiagnostics(document)?.[0];

        assert.strictEqual(message, messages.style.height);
      });
    });
  });

  test('<div> with sufficient lineHeight in rem', async () => {
    const div =
      '<div style={{ fontSize: "1rem", lineHeight: "1.5rem"}}>text</div>';

    const document = await getDocument(div);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 0);
  });

  test('<div> with nested element having insufficient color contrast', async () => {
    const div =
      '<div><div style={{ color: "black", backgroundColor: "black"}}>nested text</div></div>';

    const document = await getDocument(div);
    const { message } = generateDiagnostics(document)?.[0];

    assert.strictEqual(message, messages.style.color);
  });

  test('Pass validation for <div> with sufficient line height', async () => {
    const div =
      '<div style={{ fontSize: "1.125rem", lineHeight: 1.5}}>text</div>';

    const document = await getDocument(div);
    const errors = generateDiagnostics(document);

    assert.strictEqual(errors.length, 0);
  });
});
