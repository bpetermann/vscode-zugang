import assert from 'assert';
import { StyleValidator } from '../diagnostics/validators/StyleValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx: ValidationContext = { seenElements: [] };

suite('StyleValidator Test Suite', () => {
  test('element with no inline style produces no violation', () => {
    const node = new FakeNode('div');
    const violations = new StyleValidator().validate(node, ctx);
    assert.strictEqual(violations.length, 0);
  });

  test('insufficient contrast produces a color violation', () => {
    const node = new FakeNode('div');
    node.style = { 'background-color': 'red', color: 'red' };
    const violations = new StyleValidator().validate(node, ctx);
    assert.ok(violations.find((v) => v.message === messages.style.color));
  });

  test('sufficient contrast produces no color violation', () => {
    const node = new FakeNode('div');
    node.style = { 'background-color': 'white', color: 'black' };
    const violations = new StyleValidator().validate(node, ctx);
    assert.ok(!violations.find((v) => v.message === messages.style.color));
  });

  test('font-size below 9px produces a font violation', () => {
    const node = new FakeNode('div');
    node.style = { 'font-size': '6px' };
    const violations = new StyleValidator().validate(node, ctx);
    assert.ok(violations.find((v) => v.message === messages.style.font));
  });

  test('insufficient line-height produces a height violation', () => {
    const node = new FakeNode('div');
    node.style = { 'font-size': '16px', 'line-height': '1' };
    const violations = new StyleValidator().validate(node, ctx);
    assert.ok(violations.find((v) => v.message === messages.style.height));
  });

  test('problematic font family produces a family violation with the family appended', () => {
    const family = 'Chiller';
    const node = new FakeNode('div');
    node.style = { 'font-family': family };
    const violations = new StyleValidator().validate(node, ctx);
    assert.ok(
      violations.find((v) => v.message === messages.style.family + family)
    );
  });

  test('all problematic styles together produces four violations', () => {
    const node = new FakeNode('div');
    node.style = {
      'background-color': 'black',
      color: 'black',
      'font-size': '6px',
      'font-family': 'Chiller',
      'line-height': '1',
    };
    const violations = new StyleValidator().validate(node, ctx);
    assert.strictEqual(violations.length, 4);
  });

  test('valid styles produce no violations', () => {
    const node = new FakeNode('div');
    node.style = {
      'background-color': 'black',
      color: 'white',
      'font-size': '12px',
      'font-family': 'Arial, "Helvetica Neue", Helvetica, sans-serif',
      'line-height': '1.5',
    };
    const violations = new StyleValidator().validate(node, ctx);
    assert.strictEqual(violations.length, 0);
  });
});
