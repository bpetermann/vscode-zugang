import assert from 'assert';
import { DiagnosticSeverity } from 'vscode';
import { LinkValidator } from '../diagnostics/validators/LinkValidator';
import { messages } from '../diagnostics/utils/messages';
import { FakeNode } from './FakeNode';
import { ValidationContext } from '../diagnostics/utils/RuleValidator';

const ctx = (): ValidationContext => ({ seenElements: [] });

const link = (
  attrs: Record<string, string> = {},
  text = 'Learn more'
): FakeNode => {
  const a = new FakeNode('a', attrs);
  a.text = text;
  return a;
};

suite('LinkValidator Test Suite', () => {
  test('link with a non-generic descriptive text produces no violation', () => {
    const node = link({ href: '/blog' }, 'Learn how to create meaningful content');
    const violations = new LinkValidator().validate(node, ctx());
    assert.strictEqual(violations.length, 0);
  });

  test('link with generic text "Click" produces a generic violation with the text quoted', () => {
    const node = link({ href: '/blog' }, 'Click');
    const violations = new LinkValidator().validate(node, ctx());
    assert.ok(
      violations.find((v) => v.message === `${messages.link.generic}"Click"`)
    );
  });

  test('link with onclick produces a link.onclick violation', () => {
    const node = link({ onclick: 'click()' });
    const violations = new LinkValidator().validate(node, ctx());
    assert.ok(violations.find((v) => v.message === messages.link.onclick));
  });

  test('link with mailto href but no @ in text produces a link.mail violation', () => {
    const node = link(
      { href: 'mailto:support@office.com' },
      'If you want to learn more about our products, contact us'
    );
    const violations = new LinkValidator().validate(node, ctx());
    assert.ok(violations.find((v) => v.message === messages.link.mail));
  });

  test('multiple links, none with aria-current, produce a link.current Hint on the first', () => {
    const validator = new LinkValidator();
    const c = ctx();
    const a = ['home', 'products', 'contact'].map((t) =>
      link({ href: t }, t)
    );
    a.forEach((node) => validator.validate(node, c));
    const violations = validator.finalize(c);
    assert.strictEqual(violations[0].message, messages.link.current);
    assert.strictEqual(violations[0].severity, DiagnosticSeverity.Hint);
    assert.strictEqual(violations[0].node, a[0]);
  });

  test('multiple links with at least one aria-current produce no link.current violation', () => {
    const validator = new LinkValidator();
    const c = ctx();
    [
      link({ href: 'home', 'aria-current': 'page' }, 'home'),
      link({ href: 'products' }, 'products'),
    ].forEach((node) => validator.validate(node, c));
    assert.strictEqual(validator.finalize(c).length, 0);
  });

  test('a chain of 6 sibling links produces a link.list Hint on the first', () => {
    const validator = new LinkValidator();
    const c = ctx();
    const anchors: FakeNode[] = [];
    for (let i = 0; i < 6; i++) {
      anchors.push(
        link(i === 0 ? { 'aria-current': 'page', href: `#${i}` } : { href: `#${i}` })
      );
    }
    for (let i = 0; i < anchors.length; i++) {
      anchors[i].previousElementSibling = anchors[i - 1];
      anchors[i].nextElementSibling = anchors[i + 1];
    }
    anchors.forEach((node) => validator.validate(node, c));
    // Sequence check fires per-node, so any of the anchors might emit; find the .list violation:
    const allDiagnostics = [
      ...anchors.flatMap((a) => validator.validate(a, ctx())),
      ...validator.finalize(c),
    ];
    assert.ok(allDiagnostics.find((v) => v.message === messages.link.list));
  });

  test('a chain of 5 sibling links produces no link.list violation', () => {
    const validator = new LinkValidator();
    const c = ctx();
    const anchors: FakeNode[] = [];
    for (let i = 0; i < 5; i++) {
      anchors.push(link({ href: `#${i}`, 'aria-current': i === 0 ? 'page' : '' }, `n${i}`));
    }
    for (let i = 0; i < anchors.length; i++) {
      anchors[i].previousElementSibling = anchors[i - 1];
      anchors[i].nextElementSibling = anchors[i + 1];
    }
    anchors.forEach((node) => validator.validate(node, c));
    const all = [
      ...anchors.flatMap((a) => validator.validate(a, ctx())),
      ...validator.finalize(c),
    ];
    assert.ok(!all.find((v) => v.message === messages.link.list));
  });
});
