import assert from 'assert';
import { UniquenessValidator } from '../diagnostics/validators/UniquenessValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('UniquenessValidator Test Suite', () => {
  test('a single <title> produces no violation', () => {
    const validator = new UniquenessValidator();
    const c = ctx();
    validator.validate(new FakeNode('title'), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('two <title> elements produce a violation with messages.title.shouldBeUnique', () => {
    const validator = new UniquenessValidator();
    const c = ctx();
    const first = new FakeNode('title');
    validator.validate(first, c);
    validator.validate(new FakeNode('title'), c);
    const violations = validator.finalize(c);
    assert.strictEqual(violations[0].message, messages.title.shouldBeUnique);
    assert.strictEqual(violations[0].node, first);
  });

  test('two <main> elements produce a main shouldBeUnique violation', () => {
    const validator = new UniquenessValidator();
    const c = ctx();
    validator.validate(new FakeNode('main'), c);
    validator.validate(new FakeNode('main'), c);
    assert.strictEqual(
      validator.finalize(c)[0].message,
      messages.main.shouldBeUnique
    );
  });

  test('two <h1> elements produce an h1 shouldBeUnique violation', () => {
    const validator = new UniquenessValidator();
    const c = ctx();
    validator.validate(new FakeNode('h1'), c);
    validator.validate(new FakeNode('h1'), c);
    assert.strictEqual(
      validator.finalize(c)[0].message,
      messages.h1.shouldBeUnique
    );
  });

  test('reset() clears accumulated state', () => {
    const validator = new UniquenessValidator();
    const c = ctx();
    validator.validate(new FakeNode('h1'), c);
    validator.validate(new FakeNode('h1'), c);
    assert.strictEqual(validator.finalize(c).length, 1);

    validator.reset();
    validator.validate(new FakeNode('h1'), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });
});
