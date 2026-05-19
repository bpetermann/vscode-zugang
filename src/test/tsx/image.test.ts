import assert from 'assert';
import { ImageValidator } from '../../diagnostics/tsx/validators/Image';
import { messages } from '../../diagnostics/utils/messages';
import { FakeNode } from '../FakeNode';
import { ValidationContext } from '../../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

suite('TSX ImageValidator Test Suite', () => {
  test('img without alt produces messages.img.alt', () => {
    const node = new FakeNode('img', { src: '/me.jpg' });
    const violations = new ImageValidator().validate(node, ctx());
    assert.strictEqual(violations[0].message, messages.img.alt);
  });

  test('img with empty alt produces no violation', () => {
    const node = new FakeNode('img', { src: '/me.jpg', alt: '' });
    const violations = new ImageValidator().validate(node, ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('img with generic alt token (e.g., .jpg) produces messages.img.generic with the alt appended', () => {
    const node = new FakeNode('img', { src: '/me.jpg', alt: 'A .jpg' });
    const violations = new ImageValidator().validate(node, ctx());
    assert.strictEqual(violations[0].message, messages.img.generic + 'A .jpg');
  });

  test('img with descriptive non-generic alt produces no violation', () => {
    const node = new FakeNode('img', { src: '/me.jpg', alt: 'A portrait of me' });
    const violations = new ImageValidator().validate(node, ctx());
    assert.strictEqual(violations.length, 0);
  });
});
