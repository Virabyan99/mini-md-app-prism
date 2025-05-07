import type { TextMatchTransformer } from '@lexical/markdown';
import { MathNode } from '@/components/MathNode';

const INLINE_RE = /\$(?!\s)([^$]+?)\$(?!\w)/;

export const MATH: TextMatchTransformer = {
  dependencies: [MathNode],
  export: (node) => {
    if (node instanceof MathNode) {
      return node.__mode === 'inline'
        ? `$${node.__latex}$`
        : `$$\n${node.__latex}\n$$`;
    }
    return null;
  },
  importRegExp: INLINE_RE,
  regExp: INLINE_RE,
  replace: (textNode, match) => {
    const [, body] = match;
    const mathNode = new MathNode(body.trim(), 'inline');
    textNode.replace(mathNode);
  },
  trigger: '$',
  type: 'text-match',
};