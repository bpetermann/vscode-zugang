import assert from 'assert';
import { NavigationValidator } from '../diagnostics/validators/NavigationValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('NavigationValidator Test Suite', () => {
  test('a single <nav> without a label produces no violation after finalize', () => {
    const validator = new NavigationValidator();
    const c = ctx();
    const nav = new FakeNode('nav');
    validator.validate(nav, c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 0);
  });

  test('two <nav> elements without labels produce two violations', () => {
    const validator = new NavigationValidator();
    const c = ctx();
    validator.validate(new FakeNode('nav'), c);
    validator.validate(new FakeNode('nav'), c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 2);
    assert.strictEqual(violations[0].message, messages.nav.label);
  });

  test('two <nav> elements each with aria-label produce no violations', () => {
    const validator = new NavigationValidator();
    const c = ctx();
    validator.validate(new FakeNode('nav', { 'aria-label': 'main' }), c);
    validator.validate(new FakeNode('nav', { 'aria-label': 'customer service' }), c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 0);
  });

  test('aria-labelledby is also accepted as a label', () => {
    const validator = new NavigationValidator();
    const c = ctx();
    validator.validate(new FakeNode('nav', { 'aria-labelledby': 'h1' }), c);
    validator.validate(new FakeNode('nav', { 'aria-labelledby': 'h2' }), c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 0);
  });

  test('only the unlabeled nav among two produces a violation, attached to that nav', () => {
    const validator = new NavigationValidator();
    const c = ctx();
    const labeled = new FakeNode('nav', { 'aria-label': 'main' });
    const unlabeled = new FakeNode('nav');
    validator.validate(labeled, c);
    validator.validate(unlabeled, c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 1);
    assert.strictEqual(violations[0].node, unlabeled);
  });

  test('reset() clears accumulated state between runs', () => {
    const validator = new NavigationValidator();
    const c = ctx();
    validator.validate(new FakeNode('nav'), c);
    validator.validate(new FakeNode('nav'), c);
    assert.strictEqual(validator.finalize(c).length, 2);

    validator.reset();
    validator.validate(new FakeNode('nav'), c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 0);
  });
});
