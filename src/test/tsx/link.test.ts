import assert from 'assert';
import { LinkValidator } from '../../diagnostics/tsx/validators/Link';
import { messages } from '../../diagnostics/utils/messages';
import { FakeNode } from '../FakeNode';
import { ValidationContext } from '../../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

const link = (
  attrs: Record<string, string> = {},
  text = ''
): FakeNode => {
  const a = new FakeNode('a', attrs);
  a.text = text;
  return a;
};

suite('TSX LinkValidator Test Suite', () => {
  test('link with generic text "click" produces messages.link.generic + text (no quotes)', () => {
    const node = link({}, 'click');
    const violations = new LinkValidator().validate(node, ctx());
    assert.strictEqual(violations[0].message, messages.link.generic + 'click');
  });

  test('empty link produces no violation', () => {
    const node = link({}, '');
    const violations = new LinkValidator().validate(node, ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('link with onclick produces messages.link.onclick', () => {
    const node = link({ onclick: 'click()' }, '');
    const violations = new LinkValidator().validate(node, ctx());
    assert.ok(violations.find((v) => v.message === messages.link.onclick));
  });

  test('link with mailto href but no @ in text produces messages.link.mail', () => {
    const node = link(
      { href: 'mailto:support@office.com' },
      'contact us for more info'
    );
    const violations = new LinkValidator().validate(node, ctx());
    assert.ok(violations.find((v) => v.message === messages.link.mail));
  });

  test('link with descriptive text produces no violation', () => {
    const node = link({ href: '/blog' }, 'Learn how to write good content');
    const violations = new LinkValidator().validate(node, ctx());
    assert.strictEqual(violations.length, 0);
  });
});
