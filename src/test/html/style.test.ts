import * as assert from 'assert';
import { Element } from 'domhandler';
import { StyleValidator } from '../../diagnostics/html/validators';
import { messages } from '../../diagnostics/utils/messages';

suite('Style Test Suite', () => {
  test('Should handle invalid styles gracefully', async () => {
    const div = new Element('div', {
      style: 'invalid',
    });

    const errors = new StyleValidator().validate([div]);

    assert.strictEqual(errors.length, 0);
  });

  test('Element without color/background sufficient ratio', async () => {
    const div = new Element('div', {
      style: 'background-color: red; color: red;',
    });

    const { message } = new StyleValidator().validate([div])?.[0];

    assert.strictEqual(message, messages.style.color);
  });

  test('Element with color/background sufficient ratio', async () => {
    const div = new Element('div', {
      style: 'background-color: white; color: black;',
    });

    const errors = new StyleValidator().validate([div]);

    assert.strictEqual(errors.length, 0);
  });

  test('Element without sufficent font-size', async () => {
    const div = new Element('div', {
      style: 'font-size: 6px;',
    });

    const { message } = new StyleValidator().validate([div])?.[0];

    assert.strictEqual(message, messages.style.font);
  });

  test('Element wit problematic font family', async () => {
    const div = new Element('div', {
      style: 'font-family: Chiller;',
    });

    const { message } = new StyleValidator().validate([div])?.[0];

    assert.strictEqual(message, messages.style.font);
  });

  test('Element wit insufficent line-height', async () => {
    const div = new Element('div', {
      style: 'font-size: 16px; line-height: 1',
    });

    const { message } = new StyleValidator().validate([div])?.[0];

    assert.strictEqual(message, messages.style.height);
  });

  test('Element with multiple issues', async () => {
    const div = new Element('div', {
      style:
        'background-color: black; color: black; font-size: 6px; font-family: Chiller; line-height: 1',
    });

    const errors = new StyleValidator().validate([div]);

    assert.strictEqual(errors.length, 4);
  });

  test('Element with correct inline styles', async () => {
    const div = new Element('div', {
      style:
        'background-color: black; color: white; font-size: 12px; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;; line-height: 1.5',
    });

    const errors = new StyleValidator().validate([div]);

    assert.strictEqual(errors.length, 0);
  });
});
