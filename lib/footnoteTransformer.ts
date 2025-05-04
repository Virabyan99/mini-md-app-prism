import type { TextMatchTransformer } from '@lexical/markdown';
import { FootnoteRefNode } from '@/components/FootnoteRefNode';

const FOOTNOTE_RE = /\^\[([^\]]+)]/;

let counter = 0;

export const FOOTNOTES: TextMatchTransformer = {
  dependencies: [FootnoteRefNode],
  export: (node) => {
    if (node instanceof FootnoteRefNode) {
      return `^[${node.__note}]`;
    }
    return null;
  },
  importRegExp: FOOTNOTE_RE,
  replace: (textNode, match) => {
    const [, note] = match;
    counter += 1;
    const footnoteNode = new FootnoteRefNode(note, counter);
    textNode.replace(footnoteNode);
  },
  trigger: ']',
  type: 'text-match',
};