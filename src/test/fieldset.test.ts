import assert from 'assert';
import { FieldsetValidator } from '../diagnostics/validators/FieldsetValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx: ValidationContext = { seenElements: [] };

suite('FieldsetValidator Test Suite', () => {
  test('fieldset with <legend> as first child produces no violation', () => {
    const legend = new FakeNode('legend');
    legend.text = 'What is your spirit animal?';
    const node = new FakeNode('fieldset', {}, [legend]);
    const violations = new FieldsetValidator().validate(node, ctx);
    assert.strictEqual(violations.length, 0);
  });

  test('fieldset with no children produces a legend violation', () => {
    const node = new FakeNode('fieldset');
    const violations = new FieldsetValidator().validate(node, ctx);
    assert.strictEqual(violations[0].message, messages.fieldset.legend);
  });

  test('fieldset with <legend> nested inside another element produces a violation', () => {
    const legend = new FakeNode('legend');
    legend.text = 'What is your spirit animal?';
    const wrapper = new FakeNode('div', {}, [legend]);
    const node = new FakeNode('fieldset', {}, [wrapper]);
    const violations = new FieldsetValidator().validate(node, ctx);
    assert.strictEqual(violations[0].message, messages.fieldset.legend);
  });

  test('fieldset whose first child is a non-legend element produces a violation', () => {
    const div = new FakeNode('div');
    const legend = new FakeNode('legend');
    const node = new FakeNode('fieldset', {}, [div, legend]);
    const violations = new FieldsetValidator().validate(node, ctx);
    assert.strictEqual(violations[0].message, messages.fieldset.legend);
  });
});
