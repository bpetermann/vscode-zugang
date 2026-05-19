import assert from 'assert';
import { AttributesValidator } from '../diagnostics/validators/AttributesValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('AttributesValidator Test Suite', () => {
  test('<html lang> produces no violation', () => {
    const validator = new AttributesValidator();
    const c = ctx();
    validator.validate(new FakeNode('html', { lang: 'en' }), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('<html> without lang produces messages.html.hasMissingAttribute', () => {
    const validator = new AttributesValidator();
    const c = ctx();
    const first = new FakeNode('html');
    validator.validate(first, c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations[0].message, messages.html.hasMissingAttribute);
    assert.strictEqual(violations[0].node, first);
  });

  test('<html lang="">  (empty lang) produces a violation', () => {
    const validator = new AttributesValidator();
    const c = ctx();
    validator.validate(new FakeNode('html', { lang: '' }), c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations[0].message, messages.html.hasMissingAttribute);
  });

  test('<meta name> produces no violation', () => {
    const validator = new AttributesValidator();
    const c = ctx();
    validator.validate(new FakeNode('meta', { name: 'viewport' }), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('<meta> without name produces messages.meta.hasMissingAttribute', () => {
    const validator = new AttributesValidator();
    const c = ctx();
    validator.validate(new FakeNode('meta'), c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations[0].message, messages.meta.hasMissingAttribute);
  });

  test('two <meta> elements, at least one with name, produces no violation', () => {
    const validator = new AttributesValidator();
    const c = ctx();
    validator.validate(new FakeNode('meta'), c);
    validator.validate(new FakeNode('meta', { name: 'viewport' }), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('document with no <html> or <meta> produces no violations', () => {
    const validator = new AttributesValidator();
    const c = ctx();
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('reset() clears accumulated state', () => {
    const validator = new AttributesValidator();
    const c = ctx();
    validator.validate(new FakeNode('html'), c);
    assert.strictEqual(validator.finalize(c).length, 1);

    validator.reset();
    validator.validate(new FakeNode('html', { lang: 'en' }), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });
});
