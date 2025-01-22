import assert from 'assert';
import { Element } from 'domhandler';
import { HTMLElement } from '../../diagnostics/html/Element';

suite('Element Test Suite', () => {
  test("Should allow 'aria-hidden' on a plain <div> element", async () => {
    const element = new Element('div', {});
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), true);
  });

  test("Should not allow 'aria-hidden' on a <button> element", async () => {
    const element = new Element('button', {});
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), false);
  });

  test("Should allow 'aria-hidden' on a <button> element with 'disabled' attribute", async () => {
    const element = new Element('button', { disabled: 'true' });
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), true);
  });

  test("Should not allow 'aria-hidden' on a plain <input> element", async () => {
    const element = new Element('input', {});
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), false);
  });

  test("Should allow 'aria-hidden' on an <input> element with tabindex='-1'", async () => {
    const element = new Element('input', { tabindex: '-1' });
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), true);
  });

  test("Should not allow 'aria-hidden' on an <a> element with href attribute", async () => {
    const element = new Element('a', { href: '/blog' });
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), false);
  });

  test("Should not allow 'aria-hidden' on an element with contenteditable='true'", async () => {
    const element = new Element('blockquote', { contenteditable: 'true' });
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), false);
  });

  test("Should not allow 'aria-hidden' on an element with a positive tabindex", async () => {
    const element = new Element('div', { tabindex: '2' });
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), false);
  });

  test("Should not allow 'aria-hidden' on an element with role='button'", async () => {
    const element = new Element('div', { role: 'button' });
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), false);
  });

  test("Should allow 'aria-hidden' on a <select> element with tabindex='-1'", async () => {
    const element = new Element('select', { tabindex: '-1' });
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), true);
  });

  test("Should allow 'aria-hidden' on a <textarea> element with 'disabled' attribute", async () => {
    const element = new Element('textarea', { disabled: 'true' });
    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), true);
  });

  test("Should not allow 'aria-hidden' if a nested element is focusable", async () => {
    let element = new Element('div', { role: 'button' });

    for (let index = 0; index < 5; index++) {
      element = new Element('div', {}, [element]);
    }

    assert.strictEqual(HTMLElement.canHaveAriaHidden(element), false);
  });
});
