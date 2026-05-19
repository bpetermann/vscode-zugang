import assert from 'assert';
import { InputValidator } from '../diagnostics/validators/InputValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('InputValidator Test Suite', () => {
  test('input nested inside a <label> produces no violation', () => {
    const input = new FakeNode('input', { type: 'text' });
    const label = new FakeNode('label', {}, [input]);
    input.parent = label;
    const violations = new InputValidator().validate(input, ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('input with adjacent prev-sibling <label> and an id produces no violation', () => {
    const label = new FakeNode('label');
    const input = new FakeNode('input', { id: 'username' });
    input.previousElementSibling = label;
    const violations = new InputValidator().validate(input, ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('input with adjacent prev-sibling <label> but no id produces a violation', () => {
    const label = new FakeNode('label');
    const input = new FakeNode('input', { type: 'text' });
    input.previousElementSibling = label;
    const violations = new InputValidator().validate(input, ctx());
    assert.strictEqual(violations[0].message, messages.input.label);
  });

  test('input with aria-labelledby produces no violation', () => {
    const input = new FakeNode('input', {
      type: 'text',
      'aria-labelledby': 'btn_search',
    });
    const violations = new InputValidator().validate(input, ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('input with no label association produces a violation', () => {
    const input = new FakeNode('input', { type: 'text' });
    const violations = new InputValidator().validate(input, ctx());
    assert.strictEqual(violations[0].message, messages.input.label);
  });
});
