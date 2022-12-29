import { fromMarkdown } from "mdast-util-from-markdown";
import type * as ast from "mdast";
import { visit } from "unist-util-visit";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";

export type Tree = ast.Root;

export function parse(input: string): Tree {
  const tree = fromMarkdown(input, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });

  visit(tree, "paragraph", (node) => {
    // (node as any).type = "somethingElse"
    console.log(node);
  });

  return tree;
}

// const isMastodonLink = (node: ast.Paragraph) => {
//   return node.children.length === 1 &&
//     node.children[0].type === 'link' &&
//     (tweetRegexp.test(node.children[0].url) ||
//      momentRegexp.test(node.children[0].url)) &&
//     node.children[0].children.length >= 1 &&
//     flattenEms(node.children[0].children) === node.children[0].url;
// }
