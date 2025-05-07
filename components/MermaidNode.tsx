import { DecoratorNode } from 'lexical';
import MermaidDiagram from './MermaidDiagram';

export class MermaidNode extends DecoratorNode<JSX.Element> {
  __code: string;

  static getType() {
    return 'mermaid-diagram';
  }

  static clone(node: MermaidNode) {
    return new MermaidNode(node.__code, node.__key);
  }

  constructor(code: string, key?: string) {
    super(key);
    this.__code = code;
  }

  createDOM() {
    const div = document.createElement('div');
    return div;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <MermaidDiagram code={this.__code} />;
  }

  exportJSON() {
    return {
      type: 'mermaid-diagram',
      code: this.__code,
      version: 1,
    };
  }
}