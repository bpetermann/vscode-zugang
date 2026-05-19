import assert from 'assert';
import { SectionValidator } from '../diagnostics/validators/SectionValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('SectionValidator Test Suite', () => {
  test('a single <section> without a label produces no violation after finalize', () => {
    const validator = new SectionValidator();
    const c = ctx();
    validator.validate(new FakeNode('section'), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('two <section> elements without labels produce two violations', () => {
    const validator = new SectionValidator();
    const c = ctx();
    validator.validate(new FakeNode('section'), c);
    validator.validate(new FakeNode('section'), c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 2);
    assert.strictEqual(violations[0].message, messages.section.label);
  });

  test('two <section> elements with aria-label produce no violations', () => {
    const validator = new SectionValidator();
    const c = ctx();
    validator.validate(new FakeNode('section', { 'aria-label': 'about me' }), c);
    validator.validate(new FakeNode('section', { 'aria-label': 'contact' }), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('only the unlabeled section among two produces a violation', () => {
    const validator = new SectionValidator();
    const c = ctx();
    const labeled = new FakeNode('section', { 'aria-labelledby': 'h1' });
    const unlabeled = new FakeNode('section');
    validator.validate(labeled, c);
    validator.validate(unlabeled, c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 1);
    assert.strictEqual(violations[0].node, unlabeled);
  });

  test('reset() clears accumulated state', () => {
    const validator = new SectionValidator();
    const c = ctx();
    validator.validate(new FakeNode('section'), c);
    validator.validate(new FakeNode('section'), c);
    assert.strictEqual(validator.finalize(c).length, 2);

    validator.reset();
    validator.validate(new FakeNode('section'), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });
});
