import { DecoratorNode } from 'lexical';
import ImageWithControls from './ImageWithControls';

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __alt: string;
  __title: string | null;

  static getType() {
    return 'image';
  }

  static clone(n: ImageNode) {
    return new ImageNode(n.__src, n.__alt, n.__title, n.__key);
  }

  constructor(src: string, alt = '', title: string | null = null, key?: string) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__title = title;
  }

  createDOM() {
    const div = document.createElement('div');
    return div;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <ImageWithControls
        src={this.__src}
        alt={this.__alt}
        title={this.__title}
      />
    );
  }
}