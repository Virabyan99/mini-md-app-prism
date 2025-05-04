import {
    ElementTransformer,
  } from '@lexical/markdown';
  import {
    HorizontalRuleNode,
    $createHorizontalRuleNode,
    $isHorizontalRuleNode,
  } from '@lexical/react/LexicalHorizontalRuleNode';
  
  /** ---  ***  ___   →  <hr> */
  export const HORIZONTAL_RULE: ElementTransformer = {
    dependencies: [HorizontalRuleNode],
    export(node) {
      return $isHorizontalRuleNode(node) ? '---' : null;
    },
    regExp: /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/,   // CM spec
    replace(parentNode) {
      parentNode.replace($createHorizontalRuleNode());
    },
  };