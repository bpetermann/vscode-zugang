import assert from 'assert';
import { messages } from '../diagnostics/utils/messages';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';
import { ImageValidator } from '../diagnostics/validators/ImageValidator';
import { FakeNode } from './FakeNode';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('ImageValidator Test Suite', () => {
  test('img without alt attribute produces a violation', () => {
    const node = new FakeNode('img', { src: 'send.png' });
    const violations = new ImageValidator().validate(node, ctx());
    assert.strictEqual(violations[0].message, messages.img.alt);
  });

  test('img with empty alt attribute produces no violation', () => {
    const node = new FakeNode('img', { src: 'send.png', alt: '' });
    const violations = new ImageValidator().validate(node, ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('img with non-empty alt produces no violation', () => {
    const node = new FakeNode('img', { src: 'send.png', alt: 'send icon' });
    const violations = new ImageValidator().validate(node, ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('img with generic alt token produces messages.img.generic with the alt appended', () => {
    const node = new FakeNode('img', { src: '/me.jpg', alt: 'A .jpg' });
    const violations = new ImageValidator().validate(node, ctx());
    assert.strictEqual(
      violations.find((v) => v.message.startsWith(messages.img.generic))
        ?.message,
      messages.img.generic + 'A .jpg',
    );
  });

  test('img with descriptive non-generic alt produces no generic violation', () => {
    const node = new FakeNode('img', {
      src: '/me.jpg',
      alt: 'A portrait of me',
    });
    const violations = new ImageValidator().validate(node, ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('four images sharing the same alt produce a repeated violation on finalize', () => {
    const validator = new ImageValidator();
    const c = ctx();
    const imgs = [0, 1, 2, 3].map(() => new FakeNode('img', { alt: 'Beach' }));
    imgs.forEach((img) => validator.validate(img, c));
    const violations = validator.finalize(c);
    assert.strictEqual(violations.length, 1);
    assert.strictEqual(violations[0].message, messages.img.repeated);
    assert.strictEqual(violations[0].node, imgs[0]);
  });

  test('three images sharing the same alt produce no repeated violation', () => {
    const validator = new ImageValidator();
    const c = ctx();
    [0, 1, 2].forEach(() =>
      validator.validate(new FakeNode('img', { alt: 'Beach' }), c),
    );
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('reset() clears accumulated alt-text state', () => {
    const validator = new ImageValidator();
    const c = ctx();
    [0, 1, 2, 3].forEach(() =>
      validator.validate(new FakeNode('img', { alt: 'X' }), c),
    );
    assert.strictEqual(validator.finalize(c).length, 1);

    validator.reset();
    validator.validate(new FakeNode('img', { alt: 'X' }), c);
    assert.strictEqual(validator.finalize(c).length, 0);
  });
});
