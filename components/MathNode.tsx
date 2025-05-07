import { DecoratorNode } from 'lexical';
import MathRender from './MathRender';

export type MathMode = 'inline' | 'block';

export class MathNode extends DecoratorNode<JSX.Element> {
  __latex: string;
  __mode: MathMode;

  static getType() {
    return 'math';
  }

  static clone(n: MathNode) {
    return new MathNode(n.__latex, n.__mode, n.__key);
  }

  constructor(latex: string, mode: MathMode, key?: string) {
    super(key);
    this.__latex = latex;
    this.__mode = mode;
  }

  createDOM() {
    return document.createElement(this.__mode === 'block' ? 'div' : 'span');
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <MathRender latex={this.__latex} mode={this.__mode} />;
  }
}