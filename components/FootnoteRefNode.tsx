import { DecoratorNode } from 'lexical';

export class FootnoteRefNode extends DecoratorNode<JSX.Element> {
  __note: string; // The footnote text
  __index: number; // 1-based numbering

  static getType() {
    return 'footnote-ref';
  }

  static clone(n: FootnoteRefNode) {
    return new FootnoteRefNode(n.__note, n.__index, n.__key);
  }

  constructor(note: string, index: number, key?: string) {
    super(key);
    this.__note = note;
    this.__index = index;
  }

  createDOM() {
    const sup = document.createElement('sup');
    sup.className = 'footnote-ref';
    sup.title = this.__note; // Tooltip text
    sup.textContent = `[${this.__index}]`;
    return sup;
  }

  updateDOM() {
    return false; // No mutations
  }

  decorate() {
    return null; // No React subtree
  }
}