import type { TextMatchTransformer } from '@lexical/markdown';
import { ImageNode } from '@/components/ImageNode';

export const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (node instanceof ImageNode) {
      const title = node.__title ? ` "${node.__title}"` : '';
      return `![${node.__alt}](${node.__src}${title})`;
    }
    return null;
  },
  importRegExp: /!\[([^\]]*?)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/,
  replace: (textNode, match) => {
    const [, alt, src, title] = match;
    if (!/^https?:\/\//i.test(src)) return;
    const imageNode = new ImageNode(src, alt, title ?? null);
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};