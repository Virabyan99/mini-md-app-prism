import { DecoratorNode } from 'lexical';
import AbcScore from './AbcScore';

export class AbcNode extends DecoratorNode<JSX.Element> {
  __abc: string;
  static getType() { return 'abc-score'; }
  static clone(n: AbcNode) { return new AbcNode(n.__abc, n.__key); }
  constructor(abc: string, key?: string) { super(key); this.__abc = abc; }

  createDOM() { return document.createElement('div'); }
  updateDOM() { return false; }

  decorate() { return <AbcScore abc={this.__abc} />; }
}