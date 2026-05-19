import assert from 'assert';
import { HeadingValidator } from '../diagnostics/validators/HeadingValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('HeadingValidator Test Suite', () => {
  test('h2 followed by h1 in document produces no violation', () => {
    const validator = new HeadingValidator();
    const c = ctx();
    validator.validate(new FakeNode('h2'), c);
    validator.validate(new FakeNode('h1'), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('h4 alone produces a heading.shouldExist violation on h4', () => {
    const validator = new HeadingValidator();
    const c = ctx();
    const h4 = new FakeNode('h4');
    validator.validate(h4, c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations[0].message, messages.heading.shouldExist);
    assert.strictEqual(violations[0].node, h4);
  });

  test('h4 and h3 (no h2) produce a violation on h3', () => {
    const validator = new HeadingValidator();
    const c = ctx();
    const h4 = new FakeNode('h4');
    const h3 = new FakeNode('h3');
    validator.validate(h4, c);
    validator.validate(h3, c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 1);
    assert.strictEqual(violations[0].node, h3);
  });

  test('h4, h3, h2 (no h1) produce a violation on h2', () => {
    const validator = new HeadingValidator();
    const c = ctx();
    const h4 = new FakeNode('h4');
    const h3 = new FakeNode('h3');
    const h2 = new FakeNode('h2');
    validator.validate(h4, c);
    validator.validate(h3, c);
    validator.validate(h2, c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 1);
    assert.strictEqual(violations[0].node, h2);
  });

  test('only the first heading of a duplicate level is reported', () => {
    const validator = new HeadingValidator();
    const c = ctx();
    const firstH3 = new FakeNode('h3');
    validator.validate(firstH3, c);
    validator.validate(new FakeNode('h3'), c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations[0].node, firstH3);
  });

  test('reset() clears accumulated state', () => {
    const validator = new HeadingValidator();
    const c = ctx();
    validator.validate(new FakeNode('h4'), c);
    assert.strictEqual(validator.finalize(c).length, 1);

    validator.reset();
    validator.validate(new FakeNode('h1'), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });
});
